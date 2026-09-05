begin;

-- Galerie générale (distincte des photos rattachées à un EDL).
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  logement_id uuid not null references public.logements(id) on delete cascade,
  categorie text not null check (categorie in ('Arrivée','Départ','État des lieux','Ménage','Incident','Travaux','Autre')),
  date_photo date not null default current_date,
  titre text not null default '', description text not null default '',
  nom_fichier text not null, storage_path text not null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  check (split_part(storage_path, '/', 1) = organization_id::text)
);
alter table public.photos enable row level security;
grant select, insert, update, delete on public.photos to authenticated;
drop policy if exists galerie_membres on public.photos;
create policy galerie_membres on public.photos for all to authenticated
  using (public.is_organization_member(organization_id))
  with check (public.is_organization_member(organization_id) and exists (
    select 1 from public.logements l where l.id = logement_id and l.organization_id = photos.organization_id
  ));
create index if not exists photos_organization_logement on public.photos(organization_id, logement_id);
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('galerie-media', 'galerie-media', false, 10485760, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;
drop policy if exists galerie_fichiers_membres on storage.objects;
create policy galerie_fichiers_membres on storage.objects for all to authenticated
using (bucket_id = 'galerie-media' and exists (
  select 1 from public.organization_members m where m.user_id = auth.uid()
    and m.organization_id::text = (storage.foldername(name))[1]
)) with check (bucket_id = 'galerie-media' and exists (
  select 1 from public.organization_members m where m.user_id = auth.uid()
    and m.organization_id::text = (storage.foldername(name))[1]
));

-- Une seule transaction pour l'entête, les totaux et toutes les lignes.
-- SECURITY INVOKER conserve les politiques RLS existantes.
create or replace function public.sauvegarder_facture(
  p_organization_id uuid, p_id uuid, p_document jsonb, p_creation boolean, p_updated_at timestamptz default null
) returns void language plpgsql security invoker set search_path = '' as $$
declare
  doc public.factures;
  ligne jsonb;
  ht numeric := 0; tva numeric := 0; ttc numeric;
  q numeric; prix numeric; taux numeric;
  statut_final text;
begin
  if auth.uid() is null or not public.is_organization_member(p_organization_id) then raise exception 'Accès refusé'; end if;
  if p_id is null or jsonb_typeof(p_document->'lignes') is distinct from 'array'
    or jsonb_array_length(p_document->'lignes') = 0 then raise exception 'Lignes de facture obligatoires'; end if;
  doc := jsonb_populate_record(null::public.factures, p_document - 'lignes');
  if nullif(trim(doc.numero), '') is null or doc.date_facture is null or doc.proprietaire_id is null
    or doc.remise < 0 or doc.montant_paye < 0 then raise exception 'Facture invalide'; end if;
  if not exists (select 1 from public.proprietaires where id=doc.proprietaire_id and organization_id=p_organization_id)
    or (doc.logement_id is not null and not exists (select 1 from public.logements where id=doc.logement_id and organization_id=p_organization_id))
    or (doc.voyageur_id is not null and not exists (select 1 from public.voyageurs where id=doc.voyageur_id and organization_id=p_organization_id))
  then raise exception 'Référence étrangère à l’organisation'; end if;
  for ligne in select value from jsonb_array_elements(p_document->'lignes') loop
    q := (ligne->>'quantite')::numeric; prix := (ligne->>'prix_unitaire_ht')::numeric; taux := (ligne->>'taux_tva')::numeric;
    if q is null or prix is null or taux is null or q <= 0 or prix < 0 or taux < 0 or nullif(trim(ligne->>'designation'),'') is null
      then raise exception 'Ligne invalide'; end if;
    ht := ht + q * prix; tva := tva + q * prix * taux / 100;
  end loop;
  ht := round(ht, 2); tva := round(tva, 2); ttc := greatest(0, ht + tva - doc.remise);
  statut_final := doc.statut;
  if statut_final = 'payee' then doc.montant_paye := ttc;
  elsif statut_final in ('emise','partiellement_payee') then
    statut_final := case when doc.montant_paye >= ttc then 'payee' when doc.montant_paye > 0 then 'partiellement_payee' else 'emise' end;
  end if;
  if p_creation then
    insert into public.factures(id,organization_id,numero,type_document,proprietaire_id,logement_id,voyageur_id,
      date_facture,date_echeance,remise,montant_paye,statut,observations,total_ht,total_tva,total_ttc)
    values(p_id,p_organization_id,doc.numero,doc.type_document,doc.proprietaire_id,doc.logement_id,doc.voyageur_id,
      doc.date_facture,doc.date_echeance,doc.remise,doc.montant_paye,statut_final,doc.observations,ht,tva,ttc);
  else
    perform 1 from public.factures where id=p_id and organization_id=p_organization_id and updated_at=p_updated_at for update;
    if not found then raise exception 'Facture modifiée depuis un autre appareil. Rechargez la page.'; end if;
    update public.factures set numero=doc.numero,type_document=doc.type_document,proprietaire_id=doc.proprietaire_id,
      logement_id=doc.logement_id,voyageur_id=doc.voyageur_id,date_facture=doc.date_facture,date_echeance=doc.date_echeance,
      remise=doc.remise,montant_paye=doc.montant_paye,statut=statut_final,observations=doc.observations,
      total_ht=ht,total_tva=tva,total_ttc=ttc,updated_at=clock_timestamp()
    where id=p_id and organization_id=p_organization_id;
  end if;
  delete from public.facture_lignes where facture_id=p_id and organization_id=p_organization_id;
  insert into public.facture_lignes(id,organization_id,facture_id,designation,quantite,prix_unitaire_ht,taux_tva,ordre)
  select coalesce((v->>'id')::uuid,gen_random_uuid()),p_organization_id,p_id,v->>'designation',
    (v->>'quantite')::numeric,(v->>'prix_unitaire_ht')::numeric,(v->>'taux_tva')::numeric,(n-1)::integer
  from jsonb_array_elements(p_document->'lignes') with ordinality as x(v,n);
end;
$$;
revoke all on function public.sauvegarder_facture(uuid,uuid,jsonb,boolean,timestamptz) from public, anon;
grant execute on function public.sauvegarder_facture(uuid,uuid,jsonb,boolean,timestamptz) to authenticated;

-- Les paramètres existent normalement dès la création de l'organisation.
-- Autoriser aussi leur première sauvegarde par un administrateur.
drop policy if exists "Creer parametres organisation" on public.organization_settings;
create policy "Creer parametres organisation" on public.organization_settings for insert to authenticated
  with check (public.is_organization_admin(organization_id));

-- Export cohérent des données de l'organisation. Les fichiers Storage sont référencés, pas dupliqués.
create or replace function public.exporter_organisation(p_organization_id uuid)
returns jsonb language plpgsql security invoker set search_path = '' as $$
declare t text; result jsonb := '{}'::jsonb; rows jsonb;
begin
  if auth.uid() is null or not public.is_organization_admin(p_organization_id) then raise exception 'Administrateur requis'; end if;
  foreach t in array array['proprietaires','logements','voyageurs','missions','cles','mouvements_cles',
    'etats_des_lieux','edl_zones','edl_releves','edl_cles','edl_photos','menages','pressings','factures','facture_lignes','photos','organization_settings'] loop
    execute format('select coalesce(jsonb_agg(to_jsonb(r)), ''[]''::jsonb) from public.%I r where organization_id=$1',t)
      into rows using p_organization_id;
    result := result || jsonb_build_object(t,rows);
  end loop;
  return result;
end;
$$;
revoke all on function public.exporter_organisation(uuid) from public, anon;
grant execute on function public.exporter_organisation(uuid) to authenticated;

-- Restauration entièrement transactionnelle : une contrainte violée annule toute l'opération.
create or replace function public.restaurer_organisation(p_organization_id uuid, p_donnees jsonb)
returns void language plpgsql security invoker set search_path = '' as $$
declare
  tables text[] := array['proprietaires','logements','voyageurs','missions','cles','mouvements_cles',
    'etats_des_lieux','edl_zones','edl_releves','edl_cles','edl_photos','menages','pressings','factures','facture_lignes','photos'];
  t text; i integer; row_data jsonb; cols text; vals text; affected integer; fk record; invalid boolean;
begin
  if auth.uid() is null or not public.is_organization_admin(p_organization_id) then raise exception 'Administrateur requis'; end if;
  foreach t in array tables || array['organization_settings'] loop
    if jsonb_typeof(p_donnees->t) is distinct from 'array' then raise exception 'Table manquante : %',t; end if;
    for row_data in select value from jsonb_array_elements(p_donnees->t) loop
      if row_data->>'organization_id' is distinct from p_organization_id::text then raise exception 'Organisation incompatible'; end if;
    end loop;
  end loop;
  for i in reverse array_length(tables,1)..1 loop
    execute format('delete from public.%I where organization_id=$1',tables[i]) using p_organization_id;
  end loop;
  foreach t in array tables loop
    execute format('insert into public.%I select * from jsonb_populate_recordset(null::public.%I, $1)',t,t)
      using p_donnees->t;
  end loop;
  -- Refuser aussi les FK qui pointeraient vers les données d'une autre organisation.
  for fk in
    select child.relname as child_table,parent.relname as parent_table,ca.attname as child_column,pa.attname as parent_column
    from pg_constraint c
    join pg_class child on child.oid=c.conrelid join pg_namespace ns on ns.oid=child.relnamespace
    join pg_class parent on parent.oid=c.confrelid join pg_namespace pn on pn.oid=parent.relnamespace
    join pg_attribute ca on ca.attrelid=child.oid and ca.attnum=c.conkey[1]
    join pg_attribute pa on pa.attrelid=parent.oid and pa.attnum=c.confkey[1]
    where c.contype='f' and ns.nspname='public' and pn.nspname='public' and child.relname=any(tables)
      and array_length(c.conkey,1)=1 and exists (select 1 from pg_attribute a where a.attrelid=parent.oid and a.attname='organization_id')
  loop
    execute format('select exists(select 1 from public.%I child where child.organization_id=$1 and child.%I is not null and not exists(select 1 from public.%I parent where parent.%I=child.%I and parent.organization_id=$1))',
      fk.child_table,fk.child_column,fk.parent_table,fk.parent_column,fk.child_column) into invalid using p_organization_id;
    if invalid then raise exception 'Référence étrangère à l’organisation dans %',fk.child_table; end if;
  end loop;
  -- Les paramètres sont mis à jour ; ni les membres ni les utilisateurs ne sont restaurés.
  if jsonb_array_length(p_donnees->'organization_settings') <> 1 then raise exception 'Paramètres manquants'; end if;
  select string_agg(format('%I',column_name),','),string_agg(format('r.%I',column_name),',') into cols,vals
    from information_schema.columns where table_schema='public' and table_name='organization_settings' and column_name<>'organization_id';
  execute format('update public.organization_settings set (%s)=(select %s from jsonb_populate_record(null::public.organization_settings,$1) r) where organization_id=$2',cols,vals)
    using p_donnees->'organization_settings'->0,p_organization_id;
  get diagnostics affected = row_count;
  if affected <> 1 then raise exception 'Paramètres indisponibles'; end if;
end;
$$;
revoke all on function public.restaurer_organisation(uuid,jsonb) from public, anon;
grant execute on function public.restaurer_organisation(uuid,jsonb) to authenticated;

create or replace function public.effacer_donnees_organisation(p_organization_id uuid)
returns void language plpgsql security invoker set search_path = '' as $$
declare t text;
begin
  if auth.uid() is null or not public.is_organization_admin(p_organization_id) then raise exception 'Administrateur requis'; end if;
  foreach t in array array['photos','facture_lignes','factures','pressings','menages','edl_photos','edl_cles','edl_releves','edl_zones',
    'etats_des_lieux','mouvements_cles','cles','missions','voyageurs','logements','proprietaires'] loop
    execute format('delete from public.%I where organization_id=$1',t) using p_organization_id;
  end loop;
end;
$$;
revoke all on function public.effacer_donnees_organisation(uuid) from public, anon;
grant execute on function public.effacer_donnees_organisation(uuid) to authenticated;
commit;
