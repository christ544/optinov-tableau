import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

/*
  Etape 4 (septembre 2026) : roles des utilisateurs (administrateur / editeur),
  nom obligatoire, tailles d images et point d attention sur les medias.
  Generee par `payload migrate:create`, puis completee a la main (voir les
  deux UPDATE) pour etre sans danger sur une base qui contient deja des comptes.
*/

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_users_role" AS ENUM('administrateur', 'editeur');
  -- Un compte sans nom (creation avant que le nom soit obligatoire) recoit la
  -- partie gauche de son e-mail : sans cela, la contrainte NOT NULL echouerait.
  UPDATE "users" SET "name" = split_part("email", '@', 1) WHERE "name" IS NULL OR "name" = '';
  ALTER TABLE "users" ALTER COLUMN "name" SET NOT NULL;
  ALTER TABLE "users" ADD COLUMN "role" "enum_users_role" DEFAULT 'editeur' NOT NULL;
  -- Les comptes qui existent AVANT les roles sont ceux des administrateurs
  -- actuels : on les declare tels quels, sinon plus personne ne pourrait
  -- gerer les comptes (le tableau de bord serait verrouille de l interieur).
  UPDATE "users" SET "role" = 'administrateur';
  ALTER TABLE "media" ADD COLUMN "focal_x" numeric;
  ALTER TABLE "media" ADD COLUMN "focal_y" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_vignette_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_vignette_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_vignette_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_vignette_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_vignette_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_vignette_filename" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_carte_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_carte_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_carte_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_carte_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_carte_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_carte_filename" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_grande_url" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_grande_width" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_grande_height" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_grande_mime_type" varchar;
  ALTER TABLE "media" ADD COLUMN "sizes_grande_filesize" numeric;
  ALTER TABLE "media" ADD COLUMN "sizes_grande_filename" varchar;
  CREATE INDEX "media_sizes_vignette_sizes_vignette_filename_idx" ON "media" USING btree ("sizes_vignette_filename");
  CREATE INDEX "media_sizes_carte_sizes_carte_filename_idx" ON "media" USING btree ("sizes_carte_filename");
  CREATE INDEX "media_sizes_grande_sizes_grande_filename_idx" ON "media" USING btree ("sizes_grande_filename");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP INDEX "media_sizes_vignette_sizes_vignette_filename_idx";
  DROP INDEX "media_sizes_carte_sizes_carte_filename_idx";
  DROP INDEX "media_sizes_grande_sizes_grande_filename_idx";
  ALTER TABLE "users" ALTER COLUMN "name" DROP NOT NULL;
  ALTER TABLE "users" DROP COLUMN "role";
  ALTER TABLE "media" DROP COLUMN "focal_x";
  ALTER TABLE "media" DROP COLUMN "focal_y";
  ALTER TABLE "media" DROP COLUMN "sizes_vignette_url";
  ALTER TABLE "media" DROP COLUMN "sizes_vignette_width";
  ALTER TABLE "media" DROP COLUMN "sizes_vignette_height";
  ALTER TABLE "media" DROP COLUMN "sizes_vignette_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_vignette_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_vignette_filename";
  ALTER TABLE "media" DROP COLUMN "sizes_carte_url";
  ALTER TABLE "media" DROP COLUMN "sizes_carte_width";
  ALTER TABLE "media" DROP COLUMN "sizes_carte_height";
  ALTER TABLE "media" DROP COLUMN "sizes_carte_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_carte_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_carte_filename";
  ALTER TABLE "media" DROP COLUMN "sizes_grande_url";
  ALTER TABLE "media" DROP COLUMN "sizes_grande_width";
  ALTER TABLE "media" DROP COLUMN "sizes_grande_height";
  ALTER TABLE "media" DROP COLUMN "sizes_grande_mime_type";
  ALTER TABLE "media" DROP COLUMN "sizes_grande_filesize";
  ALTER TABLE "media" DROP COLUMN "sizes_grande_filename";
  DROP TYPE "public"."enum_users_role";`)
}
