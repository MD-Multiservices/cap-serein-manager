begin;

-- Durcissement des fonctions utilitaires et déclencheurs.
alter function public.storage_organization_id(text) set search_path = '';
alter function public.set_updated_at() set search_path = '';
alter function public.handle_new_user() set search_path = '';
alter function public.prepare_edl_snapshots() set search_path = '';
alter function public.is_organization_member(uuid) set search_path = '';
alter function public.is_organization_admin(uuid) set search_path = '';

-- Les fonctions de trigger ne doivent pas être exposées comme RPC appelables.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.prepare_edl_snapshots() from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

-- Les helpers d'appartenance sont utilisés par les politiques RLS authentifiées.
revoke execute on function public.is_organization_member(uuid) from public, anon;
revoke execute on function public.is_organization_admin(uuid) from public, anon;
grant execute on function public.is_organization_member(uuid) to authenticated;
grant execute on function public.is_organization_admin(uuid) to authenticated;

-- Éviter de recalculer auth.uid() pour chaque ligne.
alter policy "Lire son propre profil" on public.profiles
  using (id = (select auth.uid()));
alter policy "Modifier son propre profil" on public.profiles
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- Index de couverture pour les clés étrangères signalées par l'advisor Supabase.
create index if not exists idx_edl_cles_cle_id on public.edl_cles(cle_id);
create index if not exists idx_edl_cles_organization_id on public.edl_cles(organization_id);
create index if not exists idx_edl_photos_organization_id on public.edl_photos(organization_id);
create index if not exists idx_edl_releves_organization_id on public.edl_releves(organization_id);
create index if not exists idx_edl_zones_organization_id on public.edl_zones(organization_id);
create index if not exists idx_etats_des_lieux_mission_id on public.etats_des_lieux(mission_id);
create index if not exists idx_etats_des_lieux_operateur_user_id on public.etats_des_lieux(operateur_user_id);
create index if not exists idx_facture_lignes_organization_id on public.facture_lignes(organization_id);
create index if not exists idx_factures_logement_id on public.factures(logement_id);
create index if not exists idx_factures_mission_id on public.factures(mission_id);
create index if not exists idx_factures_proprietaire_id on public.factures(proprietaire_id);
create index if not exists idx_factures_voyageur_id on public.factures(voyageur_id);
create index if not exists idx_menages_logement_id on public.menages(logement_id);
create index if not exists idx_menages_mission_id on public.menages(mission_id);
create index if not exists idx_menages_voyageur_id on public.menages(voyageur_id);
create index if not exists idx_mouvements_cles_mission_id on public.mouvements_cles(mission_id);
create index if not exists idx_mouvements_cles_organization_id on public.mouvements_cles(organization_id);
create index if not exists idx_mouvements_cles_voyageur_id on public.mouvements_cles(voyageur_id);
create index if not exists idx_organization_members_user_id on public.organization_members(user_id);
create index if not exists idx_organizations_created_by on public.organizations(created_by);
create index if not exists idx_photos_logement_id on public.photos(logement_id);
create index if not exists idx_pressings_logement_id on public.pressings(logement_id);
create index if not exists idx_pressings_mission_id on public.pressings(mission_id);
create index if not exists idx_pressings_voyageur_id on public.pressings(voyageur_id);

commit;
