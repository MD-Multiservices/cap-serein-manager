# Migration globale Supabase — préparation v1-alpha

## Avant la fusion

1. Dans Supabase SQL Editor, exécuter `supabase/migrations/202609050001_finish_migration.sql` en entier. Le script est transactionnel et réexécutable. Il crée la galerie privée, la sauvegarde transactionnelle des factures et les fonctions d'export/restauration réservées aux administrateurs. Il ne supprime aucune donnée lors de son installation.
2. Vérifier que `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` sont présentes dans Vercel pour Preview et Production. Aucune clé secrète n'est utilisée par l'application. Le build refuse désormais une configuration manquante au lieu d'utiliser une fausse connexion.
3. Sur la Preview, se connecter et vérifier la création, modification, suppression et le rechargement d'un ménage, d'un pressing, d'une facture et d'une photo de test. Vérifier une sauvegarde refusée (réseau coupé) : une erreur doit apparaître et le formulaire rester disponible.
4. Vérifier les paramètres avec un administrateur, puis un membre non administrateur. Le membre peut lire, mais ne peut ni modifier les paramètres ni restaurer/effacer une organisation.
5. Vérifier un EDL existant avec ses photos et signatures, la création depuis une fiche logement et le PDF. La galerie générale utilise `galerie-media`, les EDL conservent `edl-media`.
6. Après ces contrôles, fusionner la proposition dans `v1-alpha`, attendre le déploiement Vercel Ready et répéter un contrôle de lecture/rechargement.

## Sauvegardes

Les exports version 2 contiennent les données Supabase et les chemins des fichiers médias. Ils ne contiennent pas les fichiers binaires : conserver aussi le contenu des buckets pour une sauvegarde complète. Une restauration version 2 est limitée à la même organisation et remplace ses données métier dans une transaction. Les utilisateurs et les appartenances aux organisations ne sont pas restaurés.

Les anciens exports navigateur version 1 ne sont pas importés automatiquement : ils nécessitent une conversion des identifiants et des relations. Conserver ces exports si des données historiques n'ont pas encore été transférées. Aucun effacement du stockage navigateur des utilisateurs n'est effectué par cette migration.

L'effacement des données métier depuis Paramètres conserve les comptes, paramètres et fichiers médias. La suppression individuelle d'une photo retire sa référence et tente aussi de supprimer son fichier ; une erreur de nettoyage est signalée.

## Vérifications reproductibles

```sh
npm ci
npm run test:supabase
npm run lint
npm run build
```

Le test SQL utilise PostgreSQL embarqué avec le schéma fourni dans le CSV et des données fictives. Il couvre l'installation répétée, les totaux, le paiement, l'annulation d'une sauvegarde partiellement exécutée, les conflits de version, la restauration transactionnelle et l'isolation entre organisations. Les tables annexes absentes du CSV sont simulées : les tests ne remplacent pas la validation sur la Preview.

Le contrôle navigateur local couvre l'accès à l'écran de connexion et l'absence d'erreur JavaScript. Les opérations métier sur le Supabase réel restent à valider avec une session utilisateur après installation du SQL.

## Retour arrière

En cas de problème après fusion, rétablir le déploiement Vercel précédent. Conserver les nouvelles tables et fonctions : leur présence ne gêne pas la version précédente. Ne pas supprimer les données de la galerie ni les sauvegardes pour revenir en arrière.
