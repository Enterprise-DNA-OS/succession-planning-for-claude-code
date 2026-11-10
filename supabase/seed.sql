do $$ begin
 if exists(select 1 from people where code='P-101') then return; end if;
 perform set_config('app.actor','fictional-demo',true);
 insert into people(code,name,team,status,purpose,notice_date,retain_until,source) values
 ('P-101','Mara Chen','Operations','active','Critical role continuity',current_date-30,current_date+365,'Fictional demo'),
 ('P-102','Alex Reed','Operations','active','Internal development',current_date-30,current_date+365,'Fictional demo'),
 ('P-103','Alex Morgan','Finance','active','Internal development',current_date-30,current_date+365,'Fictional demo'),
 ('P-104','Leah Patel','Finance','unavailable','Critical role continuity',current_date-30,current_date+365,'Fictional demo'),
 ('P-105','Noah Blake','Quality','active','Internal development',current_date-30,current_date+365,'Fictional demo'),
 ('P-106','Tui Harris','Engineering','left','',null,current_date-10,'Fictional demo'),
 ('P-107','Aroha King','Engineering','active','Internal development',current_date-30,current_date+365,'Fictional demo');
 insert into roles(code,name,team,owner,incumbent_id,interim_id,criticality,target_date,review_due,continuity_notes,source) values
 ('R-OPS','Operations Lead','Operations','Mara Chen',(select id from people where code='P-101'),(select id from people where code='P-102'),'critical',current_date+35,current_date-4,'Alex can run the daily production meeting. Contract approval remains with the director.','Fictional demo'),
 ('R-FIN','Finance Lead','Finance','Mara Chen',(select id from people where code='P-104'),null,'critical',current_date+20,current_date-8,'Director retains payment authority. Prepare the close checklist.','Fictional demo'),
 ('R-QUAL','Quality Lead','Quality','Mara Chen',(select id from people where code='P-105'),(select id from people where code='P-102'),'important',null,current_date+30,'Keep the batch-release sign-off with the appointed quality officer.','Fictional demo'),
 ('R-ENG','Engineering Lead','Engineering','Mara Chen',null,null,'critical',current_date+10,current_date+7,'Document the maintenance supplier contacts and current projects.','Fictional demo');
 insert into successors(role_id,person_id,readiness,interest,assessed_on,evidence,assessor,source)
 select r.id,p.id,x.readiness,x.interest,current_date-x.age,x.evidence,'Mara Chen','Fictional demo'
 from (values ('R-OPS','P-102','ready','confirmed',10,'Ran two supervised production reviews'),
 ('R-QUAL','P-102','ready','confirmed',15,'Completed the quality handover with the incumbent'),
 ('R-FIN','P-103','ready','confirmed',20,'Close checklist walkthrough; reconciliation training remains'),
 ('R-FIN','P-106','ready','confirmed',120,'Historic assessment before departure'),
 ('R-ENG','P-107','within12','confirmed',10,'Needs supplier negotiation practice'),
 ('R-OPS','P-105','ready','declined',10,'Does not want the operations role')) as x(rc,pc,readiness,interest,age,evidence)
 join roles r on r.code=x.rc join people p on p.code=x.pc;
 insert into development(code,successor_id,task,owner,due,blocking,source)
 select x.code,s.id,x.task,x.owner,current_date+x.days,x.blocking,'Fictional demo'
 from (values ('D-101','R-FIN','P-103','Complete supervised month-end reconciliation','Leah Patel',-7,true),
 ('D-102','R-ENG','P-107','Lead the next supplier review','Mara Chen',14,true),
 ('D-103','R-OPS','P-102','Write the holiday cover notes','Mara Chen',-2,false)) as x(code,rc,pc,task,owner,days,blocking)
 join roles r on r.code=x.rc join people p on p.code=x.pc join successors s on s.role_id=r.id and s.person_id=p.id;
end $$;
