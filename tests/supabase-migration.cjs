const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { PGlite } = require('@electric-sql/pglite');
const schema = require('./schema.fixture.json');
const quote = s => '"' + s.replaceAll('"','""') + '"';

async function main() {
  const db = new PGlite();
  await db.exec(`create role authenticated; create role anon;
    create schema auth; create schema storage;
    create table auth.users(id uuid primary key);
    create table public.organizations(id uuid primary key);
    create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;
    create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
    create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text);
    create function storage.foldername(text) returns text[] language sql as $$select string_to_array($1,'/')$$;
  `);
  for(const table of [...new Set(schema.map(r=>r.table_name))]) {
    const columns=schema.filter(r=>r.table_name===table&&r.type_element==='COLUMN').map(r=>quote(r.nom)+' '+r.definition);
    await db.exec('create table public.'+quote(table)+'('+columns.join(',')+');');
  }
  // Tables liées aux EDL/clés : le CSV demandé ne les incluait pas.
  for(const table of ['cles','mouvements_cles','edl_zones','edl_releves','edl_cles'])
    await db.exec('create table public.'+table+'(id uuid primary key default gen_random_uuid(),organization_id uuid not null);');
  for(const row of schema.filter(r=>r.type_element==='CONSTRAINT').sort((a,b)=>Number(a.definition.startsWith('FOREIGN KEY'))-Number(b.definition.startsWith('FOREIGN KEY')))) {
    // Les seules relations hors du CSV sont fournies ci-dessus.
    await db.exec('alter table public.'+quote(row.table_name)+' add constraint '+quote(row.nom)+' '+row.definition+';');
  }
  await db.exec(`create function public.is_organization_member(uuid) returns boolean language sql stable security definer set search_path='' as
    $$select exists(select 1 from public.organization_members where organization_id=$1 and user_id=auth.uid())$$;
    create function public.is_organization_admin(uuid) returns boolean language sql stable security definer set search_path='' as
    $$select exists(select 1 from public.organization_members where organization_id=$1 and user_id=auth.uid() and role='admin')$$;
    grant usage on schema public,auth,storage to authenticated;
    grant select,insert,update,delete on all tables in schema public,storage to authenticated;
  `);
  for(const table of [...new Set(schema.map(r=>r.table_name))]) await db.exec('alter table public.'+quote(table)+' enable row level security;');
  for(const r of schema.filter(r=>r.type_element==='POLICY')) {
    const m=r.definition.match(/^(\w+) roles=\{([^}]+)\} using=(.*?) check=(.*)$/s);
    if(!m) throw Error('Policy not parsed: '+r.definition);
    await db.exec('create policy '+quote(r.nom)+' on public.'+quote(r.table_name)+' for '+m[1]+' to '+m[2]+(m[3]?' using ('+m[3]+')':'')+(m[4]?' with check ('+m[4]+')':'')+';');
  }
  const migration=fs.readFileSync(path.join(__dirname,'../supabase/migrations/202609050001_finish_migration.sql'),'utf8');
  await db.exec(migration);
  await db.exec(migration); // Le script peut être réexécuté sans perdre les données.
  const org='10000000-0000-4000-8000-000000000001', other='10000000-0000-4000-8000-000000000002';
  const admin='20000000-0000-4000-8000-000000000001', member='20000000-0000-4000-8000-000000000002';
  const owner='30000000-0000-4000-8000-000000000001', foreignOwner='30000000-0000-4000-8000-000000000002';
  const invoice='40000000-0000-4000-8000-000000000001', line='50000000-0000-4000-8000-000000000001';
  await db.query('insert into organizations values ($1),($2)',[org,other]);
  await db.query('insert into auth.users values ($1),($2)',[admin,member]);
  await db.query("insert into organization_members(organization_id,user_id,role) values($1,$2,'admin'),($1,$3,'membre')",[org,admin,member]);
  await db.query("insert into proprietaires(id,organization_id,nom) values($1,$2,'Test'),($3,$4,'Autre')",[owner,org,foreignOwner,other]);
  await db.query('insert into organization_settings(organization_id) values($1),($2)',[org,other]);
  await db.exec('set role authenticated');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[admin]);
  const doc={numero:'TEST-1',type_document:'Facture',proprietaire_id:owner,date_facture:'2026-09-05',remise:5,montant_paye:0,statut:'emise',
    lignes:[{id:line,designation:'Prestation',quantite:2,prix_unitaire_ht:50,taux_tva:20}]};
  const save=(d,creation=true,version=null)=>db.query('select sauvegarder_facture($1,$2,$3,$4,$5)',[org,invoice,d,creation,version]);
  await save(doc);
  let saved=(await db.query('select * from factures where id=$1',[invoice])).rows[0];
  assert.equal(Number(saved.total_ttc),115);
  assert.equal((await db.query('select count(*)::int n from facture_lignes')).rows[0].n,1);
  // Un identifiant dupliqué dans les lignes provoque une erreur après l'UPDATE de l'entête.
  await assert.rejects(save({...doc,numero:'NE-DOIT-PAS-RESTER',lignes:[doc.lignes[0],doc.lignes[0]]},false,saved.updated_at));
  assert.equal((await db.query('select numero from factures where id=$1',[invoice])).rows[0].numero,'TEST-1');
  assert.equal((await db.query('select count(*)::int n from facture_lignes')).rows[0].n,1);
  await assert.rejects(save({...doc,proprietaire_id:foreignOwner},false,saved.updated_at));
  await assert.rejects(save(doc,false,'2000-01-01T00:00:00Z'));
  await save({...doc,statut:'payee'},false,saved.updated_at);
  saved=(await db.query('select * from factures where id=$1',[invoice])).rows[0];
  assert.equal(Number(saved.montant_paye),115);
  assert.equal(saved.statut,'payee');
  const backup=(await db.query('select exporter_organisation($1) value',[org])).rows[0].value;
  assert.equal(backup.proprietaires.length,1);
  assert.equal(backup.facture_lignes.length,1);
  await db.query('select restaurer_organisation($1,$2)',[org,backup]);
  const broken=structuredClone(backup); broken.facture_lignes[0].facture_id=other;
  await assert.rejects(db.query('select restaurer_organisation($1,$2)',[org,broken]));
  assert.equal((await db.query('select count(*)::int n from factures')).rows[0].n,1);
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[member]);
  await assert.rejects(db.query('select effacer_donnees_organisation($1)',[org]));
  await assert.rejects(db.query('select restaurer_organisation($1,$2)',[org,backup]));
  await assert.rejects(db.query('select exporter_organisation($1)',[other]));
  await db.query("select set_config('request.jwt.claim.sub',$1,false)",[admin]);
  await db.query('select effacer_donnees_organisation($1)',[org]);
  assert.equal((await db.query('select count(*)::int n from factures')).rows[0].n,0);
  assert.equal((await db.query('select count(*)::int n from organization_settings')).rows[0].n,1);
  await db.exec('reset role');
  assert.equal((await db.query('select count(*)::int n from proprietaires where organization_id=$1',[other])).rows[0].n,1);
  await db.close();
  console.log('PASS: installation SQL réexécutable, totaux, paiement, transaction/rollback, conflits, sauvegarde/restauration, RLS et isolation des organisations.');
}
main().catch(e=>{console.error(e.message);process.exit(1);});
