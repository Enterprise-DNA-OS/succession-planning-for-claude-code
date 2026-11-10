create table settings (
 id uuid primary key default gen_random_uuid(), name text not null unique,
 days integer not null check(days between 1 and 3650),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
insert into settings(name,days) values ('assessment_freshness',90),('role_review_interval',90);
create table people (
 id uuid primary key default gen_random_uuid(), code text not null unique check(code ~ '^[A-Za-z0-9_-]+$'),
 name text not null check(length(trim(name))>0), team text not null,
 status text not null default 'active' check(status in ('active','unavailable','left')),
 purpose text not null default '', notice_date date, retain_until date,
 source text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table roles (
 id uuid primary key default gen_random_uuid(), code text not null unique check(code ~ '^[A-Za-z0-9_-]+$'),
 name text not null check(length(trim(name))>0), team text not null,
 owner text not null check(length(trim(owner))>0), incumbent_id uuid references people(id), interim_id uuid references people(id),
 criticality text not null check(criticality in ('critical','important','standard')),
 target_date date, review_due date not null, continuity_notes text not null default '',
 source text not null default '', created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table successors (
 id uuid primary key default gen_random_uuid(), role_id uuid not null references roles(id), person_id uuid not null references people(id),
 readiness text not null check(readiness in ('ready','within12','within24','unknown')),
 interest text not null check(interest in ('confirmed','unknown','declined')),
 assessed_on date, evidence text not null default '', assessor text not null default '',
 source text not null default '', unique(role_id,person_id),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table development (
 id uuid primary key default gen_random_uuid(), code text not null unique check(code ~ '^[A-Za-z0-9_-]+$'),
 successor_id uuid not null references successors(id), task text not null check(length(trim(task))>0),
 owner text not null check(length(trim(owner))>0), due date not null,
 status text not null default 'open' check(status in ('open','done')),
 completed_on date, evidence text not null default '', blocking boolean not null default true,
 source text not null default '',
 check((status='open' and completed_on is null) or (status='done' and completed_on is not null and length(trim(evidence))>0)),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table activity (
 id uuid primary key default gen_random_uuid(), entity text not null, entity_id uuid,
 actor text not null, action text not null, before_record jsonb, after_record jsonb,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create function stamp_and_log() returns trigger language plpgsql as $$
begin
 if TG_OP='UPDATE' then NEW.updated_at=now(); end if;
 insert into activity(entity,entity_id,actor,action,before_record,after_record)
 values(TG_TABLE_NAME,NEW.id,coalesce(nullif(current_setting('app.actor',true),''),'database-owner'),TG_OP,
 case when TG_OP='UPDATE' then to_jsonb(OLD) else null end,to_jsonb(NEW));
 return NEW;
end $$;
create function reject_history_changes() returns trigger language plpgsql as $$
begin raise exception 'Activity history is append-only'; end $$;
create trigger activity_immutable before update or delete on activity for each row execute function reject_history_changes();
do $$ declare t text; begin
 foreach t in array array['people','roles','successors','development','settings'] loop
 execute format('create trigger stamp before insert or update on %I for each row execute function stamp_and_log()',t);
 end loop;
 foreach t in array array['people','roles','successors','development','settings','activity'] loop
 execute format('alter table %I enable row level security',t);
 execute format('revoke all on %I from public',t);
 end loop;
end $$;
create index on successors(person_id);
create index on development(successor_id);
create index on activity(entity,entity_id,created_at);

create view successor_status as
select s.id,s.role_id,s.person_id,r.code as role_code,r.name as role,p.code as person_code,p.name as person,p.team,
 s.readiness,s.interest,p.status as availability,s.assessed_on,s.evidence,s.assessor,
 (select count(*)::integer from development d where d.successor_id=s.id and d.blocking and d.status='open') as blocking_actions,
 (s.assessed_on is null or s.assessed_on>current_date or s.assessed_on<current_date-(select days from settings where name='assessment_freshness')) as stale,
 (s.readiness='ready' and s.interest='confirmed' and p.status='active' and s.person_id is distinct from r.incumbent_id
 and s.assessed_on between current_date-(select days from settings where name='assessment_freshness') and current_date
 and length(trim(s.evidence))>0 and length(trim(s.assessor))>0
 and not exists(select 1 from development d where d.successor_id=s.id and d.blocking and d.status='open')) as usable
from successors s join people p on p.id=s.person_id join roles r on r.id=s.role_id;
create view role_coverage as
select r.id,r.code,r.name as role,r.team,r.owner,r.criticality,
 p.name as incumbent,p.status as incumbent_status,i.name as interim,i.status as interim_status,
 r.target_date,r.review_due,r.continuity_notes,
 count(s.id)::integer as nominated,
 count(s.id) filter(where s.usable)::integer as usable_successors,
 count(s.id) filter(where s.stale)::integer as stale_assessments,
 string_agg(s.person,', ' order by s.person) filter(where s.usable) as ready_names,
 case when count(s.id) filter(where s.usable)=0 then 'gap'
 when count(s.id) filter(where s.usable)=1 then 'single successor' else 'covered' end as coverage
from roles r left join people p on p.id=r.incumbent_id left join people i on i.id=r.interim_id
left join successor_status s on s.role_id=r.id
group by r.id,p.name,p.status,i.name,i.status;
create view development_board as
select d.id,d.code,r.name as role,p.name as person,d.task,d.owner,d.due,d.status,d.blocking,d.completed_on,d.evidence,
 (d.status='open' and d.due<current_date) as overdue
from development d join successors s on s.id=d.successor_id join roles r on r.id=s.role_id join people p on p.id=s.person_id;
create view shared_successors as
select person_code,person,count(*)::integer as role_count,string_agg(role,', ' order by role) as roles
from successor_status where usable group by person_code,person having count(*)>1;
create view attention as
select 'No ready cover' as issue,code as reference,role as subject,owner,review_due as due from role_coverage where usable_successors=0
union all select 'Role review overdue',code,role,owner,review_due from role_coverage where review_due<current_date
union all select 'Development overdue',code,task,owner,due from development_board where overdue
union all select 'Assessment stale',role_code,person,assessor,assessed_on from successor_status where stale
union all select 'Shared successor',person_code,roles,person,null::date from shared_successors
union all select 'Handover has no active interim',code,role,owner,target_date from role_coverage
where target_date<=current_date+60 and (interim is null or interim_status<>'active');
create view compliance_findings as
select 'NZ-IPP1' as rule,code as reference,name as subject,'Record the specific succession purpose' as finding from people where trim(purpose)=''
union all select 'NZ-IPP3/3A',code,name,'Confirm the applicable privacy notice was provided' from people where notice_date is null or notice_date>current_date
union all select 'NZ-IPP9',code,name,'Review retention purpose and disposal date' from people where retain_until is null or retain_until<current_date
union all select 'NZ-IPP8',role_code,person,'Verify assessment before relying on it' from successor_status where stale or trim(evidence)='' or trim(assessor)=''
union all select 'HOUSE-REVIEW',code,role,'Role review overdue under the configured business policy' from role_coverage where review_due<current_date;
