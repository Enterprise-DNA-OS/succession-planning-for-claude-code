#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { getDb, REPO_ROOT } from './lib/db.mjs';
import { table } from './lib/format.mjs';
import { parseCsv } from './lib/csv.mjs';

export const reads = {
 people: 'select code,name,team,status,purpose,notice_date,retain_until from people order by code',
 roles: 'select code,role,team,owner,criticality,coverage,review_due from role_coverage order by code',
 successors: 'select role_code,person_code,person,readiness,interest,availability,stale,blocking_actions,usable from successor_status order by role_code,person_code',
 coverage: 'select code,role,nominated,usable_successors,ready_names,coverage from role_coverage order by code',
 attention: 'select * from attention order by due nulls last,reference,issue',
 'shared-successors': 'select * from shared_successors order by person_code',
 development: 'select code,role,person,task,owner,due,status,blocking,overdue from development_board order by due,code',
 'reviews-due': 'select code,role,owner,review_due,stale_assessments from role_coverage where review_due<=current_date+30 or stale_assessments>0 order by review_due,code',
 contingency: "select code,role,target_date,incumbent,incumbent_status,interim,interim_status,coverage,continuity_notes from role_coverage where target_date<=current_date+60 or incumbent is null or incumbent_status<>'active' order by target_date nulls last,code",
 compliance: 'select * from compliance_findings order by rule,reference',
 activity: 'select entity,actor,action,entity_id,created_at from activity order by created_at desc,id limit 100',
 stats: "select team,count(*)::integer as roles,count(*) filter(where usable_successors=0)::integer as gaps,count(*) filter(where usable_successors=1)::integer as single_cover,count(*) filter(where review_due<current_date)::integer as overdue_reviews from role_coverage group by team order by team"
};
const extra = ['role','scenario','add-person','update-person','add-role','nominate','assess','add-action','complete-action','review-role','log','draft-handover','weekly-review','import','export','help'];
export const commands = [...Object.keys(reads), ...extra];
const required = (o,k) => { if(typeof o[k]!=='string'||!o[k].trim()) throw Error(`--${k}= is required`); return o[k].trim(); };
const day = () => new Date().toISOString().slice(0,10);
const date = (v, label, future=true) => {
 if (!v) return null;
 if (!/^\d{4}-\d{2}-\d{2}$/.test(v) || Number.isNaN(Date.parse(v)) || new Date(v).toISOString().slice(0,10)!==v) throw Error(`${label}: use a real YYYY-MM-DD date`);
 if(!future && v>day()) throw Error(`${label}: future evidence is not valid`);
 return v;
};
const enumValue=(v,vals,label)=>{if(!vals.includes(v))throw Error(`${label}: expected ${vals.join('|')}`);return v;};
const bool=(v)=>{if(v===true||v==='true')return true;if(v===false||v==='false')return false;throw Error('Boolean must be true or false');};
function outputText(rows){return table(rows,Object.keys(rows[0]||{}).map(key=>({key,label:key,width:90})));}
async function resolve(db,entity,term){
 if(!term)throw Error(`Specify a ${entity} code, name or id prefix`);
 const rows=await db.query(`select id,code,${entity==='development'?'task':'name'} as name from ${entity} order by code`);
 const q=term.toLowerCase();
 const exact=rows.filter(r=>r.code.toLowerCase()===q||r.id===term);
 const matches=exact.length?exact:rows.filter(r=>r.id.startsWith(q)||r.name.toLowerCase().includes(q));
 if(matches.length!==1)throw Error(`${matches.length?'Ambiguous':'Unknown'} ${entity}: ${term}\n${outputText(matches.length?matches:rows)}`);
 return matches[0];
}
async function successor(db,o){const r=await resolve(db,'roles',required(o,'role'));const p=await resolve(db,'people',required(o,'person'));const [s]=await db.query('select * from successors where role_id=$1 and person_id=$2',[r.id,p.id]);if(!s)throw Error('Nominate this person for the role first');return s;}
async function transaction(db,actor,fn,dry=false){
 await db.exec('BEGIN ISOLATION LEVEL REPEATABLE READ');
 try{await db.query("select set_config('app.actor',$1,true)",[actor]);const result=await fn();await db.exec(dry?'ROLLBACK':'COMMIT');return result;}
 catch(e){await db.exec('ROLLBACK');throw e;}
}
function writePrivate(file,data){fs.mkdirSync(path.dirname(file),{recursive:true,mode:0o700});fs.writeFileSync(file,data,{mode:0o600});fs.chmodSync(file,0o600);}
function draft(name,body,out){const file=path.resolve(out||path.join(REPO_ROOT,'drafts'),`${name}-${Date.now()}.md`);writePrivate(file,body);return [{file,status:'draft only'}];}

// The mapping format is ours. No public SuccessionHR native export schema was found.
export const importColumns={
 people:['code','name','team','status','purpose','notice_date','retain_until','source'],
 roles:['code','name','team','owner','incumbent_code','interim_code','criticality','target_date','review_due','continuity_notes','source'],
 successors:['role_code','person_code','readiness','interest','assessed_on','evidence','assessor','source'],
 development:['code','role_code','person_code','task','owner','due','status','completed_on','evidence','blocking','source']
};
const exportsSql={
 people:'select code,name,team,status,purpose,notice_date,retain_until,source from people order by code',
 roles:'select r.code,r.name,r.team,r.owner,p.code as incumbent_code,i.code as interim_code,r.criticality,r.target_date,r.review_due,r.continuity_notes,r.source from roles r left join people p on p.id=r.incumbent_id left join people i on i.id=r.interim_id order by r.code',
 successors:'select r.code as role_code,p.code as person_code,s.readiness,s.interest,s.assessed_on,s.evidence,s.assessor,s.source from successors s join roles r on r.id=s.role_id join people p on p.id=s.person_id order by r.code,p.code',
 development:'select d.code,r.code as role_code,p.code as person_code,d.task,d.owner,d.due,d.status,d.completed_on,d.evidence,d.blocking,d.source from development d join successors s on s.id=d.successor_id join roles r on r.id=s.role_id join people p on p.id=s.person_id order by d.code'
};
const csv=(rows,cols)=>[cols,...rows.map(r=>cols.map(k=>r[k]??''))].map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n')+'\r\n';
async function upsert(db,entity,row,keys=['code']){
 const cols=Object.keys(row),vals=Object.values(row),updates=cols.filter(c=>!keys.includes(c));
 return (await db.query(`insert into ${entity} (${cols.join(',')}) values (${cols.map((_,i)=>'$'+(i+1)).join(',')}) on conflict (${keys.join(',')}) do update set ${updates.map(c=>`${c}=excluded.${c}`).join(',')} returning id`,vals))[0];
}
async function byCode(db,entity,code,optional=false){
 if(!code&&optional)return null;
 const [r]=await db.query(`select id from ${entity} where code=$1`,[code]);if(!r)throw Error(`Unknown ${entity} code: ${code}`);return r.id;
}
async function importData(db,o){
 const dir=path.resolve(required(o,'dir'));const mapping=o.mapping?JSON.parse(fs.readFileSync(o.mapping,'utf8')):{};
 const data={};
 for(const [entity,cols] of Object.entries(importColumns)){
 const file=path.join(dir,entity+'.csv');if(!fs.existsSync(file))throw Error(`Missing ${entity}.csv; include a header-only file for an empty set`);
 let content=fs.readFileSync(file,'utf8');
 // Validate headers even on an empty file, using the same CSV parser.
 const rows=parseCsv(content);
 if(!content.trim())throw Error(`Empty ${entity}.csv`);
 let quoted=false,end=content.length,columns=1;
 for(let i=0;i<content.length;i++){
  if(content[i]==='"'){if(quoted&&content[i+1]==='"'){i++;continue;}quoted=!quoted;}
  else if(!quoted&&content[i]===',')columns++;
  else if(!quoted&&(content[i]==='\r'||content[i]==='\n')){end=i;break;}
 }
 const headerOnly=parseCsv(content.slice(0,end)+'\n'+Array(columns).fill('x').join(','));
 const sourceCols=Object.keys(headerOnly[0]||{});
 const translated=sourceCols.map(k=>mapping[entity]?.[k]||k.toLowerCase());
 if(new Set(translated).size!==translated.length||translated.some(k=>!cols.includes(k))||cols.some(k=>!translated.includes(k)))throw Error(`${entity}: map every column to exactly ${cols.join(', ')}`);
 const seen=new Set();
 data[entity]=rows.map((r,index)=>{
 const x=Object.fromEntries(Object.entries(r).map(([k,v])=>[mapping[entity]?.[k]||k.toLowerCase(),v.trim()]));
 const key=entity==='successors'?`${x.role_code}:${x.person_code}`:x.code;
 if(seen.has(key))throw Error(`${entity} row ${index+2}: duplicate key ${key}`);seen.add(key);
 for(const k of ['notice_date','retain_until','target_date','review_due','assessed_on','due','completed_on'])if(k in x)x[k]=date(x[k],`${entity}.${k}`,!['notice_date','assessed_on','completed_on'].includes(k));
 return x;
 });
 }
 return transaction(db,required(o,'actor'),async()=>{
 const counts=[];
 for(const [entity,rows] of Object.entries(data)){
 for(const raw of rows){const x={...raw};
 if(entity==='roles'){
 x.incumbent_id=await byCode(db,'people',x.incumbent_code,true);x.interim_id=await byCode(db,'people',x.interim_code,true);delete x.incumbent_code;delete x.interim_code;
 }
 if(entity==='successors'||entity==='development'){
 const rid=await byCode(db,'roles',x.role_code),pid=await byCode(db,'people',x.person_code);delete x.role_code;delete x.person_code;
 if(entity==='successors'){
 const [r]=await db.query('select incumbent_id from roles where id=$1',[rid]);if(r.incumbent_id===pid)throw Error('An incumbent cannot be their own successor');
 x.role_id=rid;x.person_id=pid;
 }else{const [s]=await db.query('select id from successors where role_id=$1 and person_id=$2',[rid,pid]);if(!s)throw Error('Development row has no matching nomination');x.successor_id=s.id;x.blocking=bool(x.blocking);}
 }
 await upsert(db,entity,x,entity==='successors'?['role_id','person_id']:['code']);
 }
 counts.push({entity,rows:rows.length,mode:o['dry-run']?'validated, rolled back':'imported'});
 }
 return counts;
 },Boolean(o['dry-run']));
}
export async function run(db,command,args=[],o={}){
 if(command in reads)return db.query(reads[command]);
 if(command==='help')return commands.map(command=>({command}));
 if(command==='role'){
 const r=await resolve(db,'roles',args[0]);
 return {role:await db.query('select * from role_coverage where id=$1',[r.id]),successors:await db.query('select * from successor_status where role_id=$1 order by person_code',[r.id]),development:await db.query('select d.code,d.task,d.owner,d.due,d.status,d.blocking,d.evidence from development d join successors s on s.id=d.successor_id where s.role_id=$1 order by d.due',[r.id]),history:await db.query("select entity,actor,action,before_record,after_record,created_at from activity where entity_id=$1 or entity_id in (select id from successors where role_id=$1) or entity_id in (select d.id from development d join successors s on s.id=d.successor_id where s.role_id=$1) order by created_at,id",[r.id])};
 }
 if(command==='scenario'){
 const p=await resolve(db,'people',args[0]);
 return db.query(`select r.code,r.name as role,count(s.id) filter(where s.usable)::integer as current_cover,
 count(s.id) filter(where s.usable and s.person_id<>$1)::integer as remaining_cover,
 string_agg(s.person,', ' order by s.person) filter(where s.usable and s.person_id<>$1) as remaining_names
 from roles r left join successor_status s on s.role_id=r.id group by r.id order by r.code`,[p.id]);
 }
 if(command==='import'){
 if(args[0]!=='successionhr')throw Error('Use import successionhr --dir=<mapped CSV folder> --actor=<name> [--dry-run] [--mapping=<file>]');
 return importData(db,o);
 }
 if(command==='export'){
 const dir=path.resolve(required(o,'dir'));if(fs.existsSync(dir)&&fs.readdirSync(dir).length)throw Error('Export directory must be empty to prevent overwriting a previous snapshot');
 return transaction(db,'export',async()=>{
 const snapshot={format:1,exported_at:new Date().toISOString(),data:{}};
 for(const [entity,sql] of Object.entries(exportsSql)){const rows=await db.query(sql);writePrivate(path.join(dir,entity+'.csv'),csv(rows,importColumns[entity]));}
 for(const entity of ['people','roles','successors','development','settings','activity'])snapshot.data[entity]=await db.query(`select * from ${entity} order by id`);
 writePrivate(path.join(dir,'snapshot.json'),JSON.stringify(snapshot,null,2)+'\n');return [{directory:dir,entities:6,status:'complete'}];
 });
 }
 if(command==='draft-handover'){
 const r=await resolve(db,'roles',args[0]);const [role]=await db.query('select * from role_coverage where id=$1',[r.id]);const people=await db.query('select person,readiness,usable,evidence,assessor from successor_status where role_id=$1 order by person_code',[r.id]);
 return draft(`handover-${r.code}`,`# DRAFT: ${role.role} handover\n\nFor the role owner to review. No appointment or authority is granted.\n\n${outputText([role])}\n\n## Recorded successor evidence\n\n${outputText(people)}\n\n## Decisions still needed\n\nConfirm dates, owner, access, training and delegated authority before sharing.\n`,o.out);
 }
 if(command==='weekly-review'){
 const [attention,coverage,development]=await Promise.all([db.query(reads.attention),db.query(reads.coverage),db.query(reads.development)]);
 return draft('weekly-review',`# DRAFT: Weekly succession review\n\n${day()} | Fictional data if running the demo.\n\n## Needs attention\n\n${outputText(attention)}\n\n## Role coverage\n\n${outputText(coverage)}\n\n## Development commitments\n\n${outputText(development)}\n\nReview evidence with the named owners. This report does not select or promote anyone.\n`,o.out);
 }
 if(!extra.includes(command))throw Error(`Unknown command: ${command}. Run help.`);
 return transaction(db,required(o,'actor'),async()=>{
 if(command==='add-person'){
 return db.query('insert into people(code,name,team,status,purpose,notice_date,retain_until,source) values($1,$2,$3,$4,$5,$6,$7,$8) returning code,name,status',[required(o,'code'),required(o,'name'),required(o,'team'),enumValue(o.status||'active',['active','unavailable','left'],'status'),required(o,'purpose'),date(required(o,'notice'),'notice',false),date(required(o,'retain-until'),'retain-until'),required(o,'source')]);
 }
 if(command==='update-person'){
 const p=await resolve(db,'people',args[0]);const updates={};
 if(o.status)updates.status=enumValue(o.status,['active','unavailable','left'],'status');
 if(o.purpose)updates.purpose=o.purpose;if(o.notice)updates.notice_date=date(o.notice,'notice',false);if(o['retain-until'])updates.retain_until=date(o['retain-until'],'retain-until');
 if(!Object.keys(updates).length)throw Error('Provide --status, --purpose, --notice or --retain-until');
 const ks=Object.keys(updates);return db.query(`update people set ${ks.map((k,i)=>`${k}=$${i+2}`).join(',')} where id=$1 returning code,name,status`,[p.id,...Object.values(updates)]);
 }
 if(command==='add-role'){
 const incumbent=o.incumbent?(await resolve(db,'people',o.incumbent)).id:null;const interim=o.interim?(await resolve(db,'people',o.interim)).id:null;
 return db.query('insert into roles(code,name,team,owner,incumbent_id,interim_id,criticality,target_date,review_due,continuity_notes,source) values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) returning code,name,review_due',[required(o,'code'),required(o,'name'),required(o,'team'),required(o,'owner'),incumbent,interim,enumValue(o.criticality||'critical',['critical','important','standard'],'criticality'),date(o.target,'target'),date(required(o,'review-due'),'review-due'),o.notes||'',required(o,'source')]);
 }
 if(command==='nominate'){
 const r=await resolve(db,'roles',required(o,'role'));const p=await resolve(db,'people',required(o,'person'));const [role]=await db.query('select incumbent_id from roles where id=$1',[r.id]);if(role.incumbent_id===p.id)throw Error('An incumbent cannot be their own successor');
 return db.query("insert into successors(role_id,person_id,readiness,interest,source) values($1,$2,'unknown','unknown',$3) returning id,readiness,interest",[r.id,p.id,required(o,'source')]);
 }
 if(command==='assess'){
 const s=await successor(db,o);
 return db.query('update successors set readiness=$2,interest=$3,assessed_on=$4,evidence=$5,assessor=$6,source=$7 where id=$1 returning id,readiness,interest',[s.id,enumValue(required(o,'readiness'),['ready','within12','within24','unknown'],'readiness'),enumValue(required(o,'interest'),['confirmed','unknown','declined'],'interest'),date(required(o,'date'),'date',false),required(o,'evidence'),required(o,'actor'),required(o,'source')]);
 }
 if(command==='add-action'){
 const s=await successor(db,o);return db.query('insert into development(code,successor_id,task,owner,due,blocking,source) values($1,$2,$3,$4,$5,$6,$7) returning code,task,due',[required(o,'code'),s.id,required(o,'task'),required(o,'owner'),date(required(o,'due'),'due'),bool(o.blocking??true),required(o,'source')]);
 }
 if(command==='complete-action'){
 const d=await resolve(db,'development',args[0]);const [old]=await db.query('select status from development where id=$1',[d.id]);if(old.status==='done')throw Error('Action is already complete');
 return db.query("update development set status='done',completed_on=$2,evidence=$3 where id=$1 returning code,status,completed_on",[d.id,date(required(o,'date'),'date',false),required(o,'evidence')]);
 }
 if(command==='review-role'){
 const r=await resolve(db,'roles',args[0]);const interim=o.interim?(await resolve(db,'people',o.interim)).id:null;
 return db.query('update roles set review_due=$2,continuity_notes=$3,interim_id=coalesce($4,interim_id) where id=$1 returning code,review_due,continuity_notes',[r.id,date(required(o,'next'),'next'),required(o,'notes'),interim]);
 }
 if(command==='log'){
 const r=await resolve(db,'roles',args[0]);return db.query("insert into activity(entity,entity_id,actor,action,after_record) values('roles',$1,$2,'NOTE',$3::jsonb) returning id,action",[r.id,required(o,'actor'),JSON.stringify({note:required(o,'note')})]);
 }
 throw Error('Unsupported command');
 });
}
function parse(argv){const positional=[],options={};for(const a of argv){if(a.startsWith('--')){const i=a.indexOf('=');const k=a.slice(2,i<0?undefined:i);if(k in options)throw Error(`Duplicate flag --${k}`);options[k]=i<0?true:a.slice(i+1);}else positional.push(a);}return {command:positional.shift()||'help',args:positional,options};}
export async function main(argv=process.argv.slice(2)){
 let db;try{const {command,args,options}=parse(argv);db=await getDb();const result=await run(db,command,args,options);if(options.json)console.log(JSON.stringify(result,null,2));else if(Array.isArray(result))console.log(outputText(result));else for(const [k,v] of Object.entries(result))console.log('\n'+k+'\n'+outputText(v));}
 catch(e){console.error(e.message);process.exitCode=1;}finally{if(db)await db.close();}
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)await main();
