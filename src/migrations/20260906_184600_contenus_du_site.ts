import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_realisations_services" AS ENUM('visuel', 'digital', 'marketing', 'ia', 'photo-video');
  CREATE TYPE "public"."enum_realisations_secteur" AS ENUM('btp', 'distribution', 'immobilier', 'sante', 'institution', 'services');
  CREATE TYPE "public"."enum_faq_theme" AS ENUM('agence', 'tarifs', 'pros-cards', 'support');
  CREATE TABLE "realisations_services" (
  	"order" integer NOT NULL,
  	"parent_id" integer NOT NULL,
  	"value" "enum_realisations_services",
  	"id" serial PRIMARY KEY NOT NULL
  );
  
  CREATE TABLE "realisations_objectifs" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"texte" varchar NOT NULL
  );
  
  CREATE TABLE "realisations_resultats" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"valeur" varchar NOT NULL,
  	"label" varchar NOT NULL
  );
  
  CREATE TABLE "realisations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"titre" varchar NOT NULL,
  	"slug" varchar,
  	"publiee" boolean DEFAULT false,
  	"ordre" numeric DEFAULT 0,
  	"client" varchar NOT NULL,
  	"annee" varchar NOT NULL,
  	"secteur" "enum_realisations_secteur" NOT NULL,
  	"extrait" varchar NOT NULL,
  	"visuel_id" integer,
  	"contexte" varchar NOT NULL,
  	"reponse" varchar NOT NULL,
  	"temoignage_verbatim" varchar,
  	"temoignage_nom" varchar,
  	"temoignage_fonction" varchar,
  	"avant_apres_activer" boolean DEFAULT false,
  	"avant_apres_avant_id" integer,
  	"avant_apres_apres_id" integer,
  	"etude_de_cas" boolean DEFAULT false,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "realisations_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"media_id" integer
  );
  
  CREATE TABLE "temoignages" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nom" varchar NOT NULL,
  	"fonction" varchar NOT NULL,
  	"entreprise" varchar NOT NULL,
  	"verbatim" varchar NOT NULL,
  	"consentement" boolean DEFAULT false NOT NULL,
  	"ordre" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "equipe" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nom" varchar NOT NULL,
  	"role" varchar NOT NULL,
  	"photo_id" integer,
  	"linkedin" varchar,
  	"ordre" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "faq" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"theme" "enum_faq_theme" DEFAULT 'agence' NOT NULL,
  	"question" varchar NOT NULL,
  	"reponse" varchar NOT NULL,
  	"ordre" numeric DEFAULT 0,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "parametres" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"nom" varchar DEFAULT 'OPTINOV' NOT NULL,
  	"baseline" varchar DEFAULT 'Communication · Marketing · Transformation digitale' NOT NULL,
  	"telephone" varchar DEFAULT '+225 01 73 73 24 21' NOT NULL,
  	"telephone_fixe" varchar DEFAULT '+225 27 22 25 22 74',
  	"whatsapp" varchar DEFAULT '2250173732421' NOT NULL,
  	"email" varchar DEFAULT 'optinovagence@gmail.com' NOT NULL,
  	"adresse" varchar DEFAULT 'Cocody Angré 7ᵉ Tranche, Abidjan — Côte d’Ivoire' NOT NULL,
  	"ville" varchar DEFAULT 'Abidjan' NOT NULL,
  	"pays" varchar DEFAULT 'Côte d’Ivoire' NOT NULL,
  	"horaires" varchar,
  	"delai_reponse" varchar DEFAULT 'sous 24 h ouvrées',
  	"rdv_url" varchar,
  	"reseaux_linkedin" varchar,
  	"reseaux_instagram" varchar,
  	"reseaux_facebook" varchar,
  	"pros_cards_inscription" varchar,
  	"pros_cards_connexion" varchar,
  	"pros_cards_demo" varchar,
  	"rccm" varchar,
  	"directeur_publication" varchar,
  	"hebergeur" varchar,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "realisations_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "temoignages_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "equipe_id" integer;
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "faq_id" integer;
  ALTER TABLE "realisations_services" ADD CONSTRAINT "realisations_services_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."realisations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "realisations_objectifs" ADD CONSTRAINT "realisations_objectifs_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."realisations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "realisations_resultats" ADD CONSTRAINT "realisations_resultats_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."realisations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "realisations" ADD CONSTRAINT "realisations_visuel_id_media_id_fk" FOREIGN KEY ("visuel_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "realisations" ADD CONSTRAINT "realisations_avant_apres_avant_id_media_id_fk" FOREIGN KEY ("avant_apres_avant_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "realisations" ADD CONSTRAINT "realisations_avant_apres_apres_id_media_id_fk" FOREIGN KEY ("avant_apres_apres_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "realisations_rels" ADD CONSTRAINT "realisations_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."realisations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "realisations_rels" ADD CONSTRAINT "realisations_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "equipe" ADD CONSTRAINT "equipe_photo_id_media_id_fk" FOREIGN KEY ("photo_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "realisations_services_order_idx" ON "realisations_services" USING btree ("order");
  CREATE INDEX "realisations_services_parent_idx" ON "realisations_services" USING btree ("parent_id");
  CREATE INDEX "realisations_objectifs_order_idx" ON "realisations_objectifs" USING btree ("_order");
  CREATE INDEX "realisations_objectifs_parent_id_idx" ON "realisations_objectifs" USING btree ("_parent_id");
  CREATE INDEX "realisations_resultats_order_idx" ON "realisations_resultats" USING btree ("_order");
  CREATE INDEX "realisations_resultats_parent_id_idx" ON "realisations_resultats" USING btree ("_parent_id");
  CREATE UNIQUE INDEX "realisations_slug_idx" ON "realisations" USING btree ("slug");
  CREATE INDEX "realisations_visuel_idx" ON "realisations" USING btree ("visuel_id");
  CREATE INDEX "realisations_avant_apres_avant_apres_avant_idx" ON "realisations" USING btree ("avant_apres_avant_id");
  CREATE INDEX "realisations_avant_apres_avant_apres_apres_idx" ON "realisations" USING btree ("avant_apres_apres_id");
  CREATE INDEX "realisations_updated_at_idx" ON "realisations" USING btree ("updated_at");
  CREATE INDEX "realisations_created_at_idx" ON "realisations" USING btree ("created_at");
  CREATE INDEX "realisations_rels_order_idx" ON "realisations_rels" USING btree ("order");
  CREATE INDEX "realisations_rels_parent_idx" ON "realisations_rels" USING btree ("parent_id");
  CREATE INDEX "realisations_rels_path_idx" ON "realisations_rels" USING btree ("path");
  CREATE INDEX "realisations_rels_media_id_idx" ON "realisations_rels" USING btree ("media_id");
  CREATE INDEX "temoignages_updated_at_idx" ON "temoignages" USING btree ("updated_at");
  CREATE INDEX "temoignages_created_at_idx" ON "temoignages" USING btree ("created_at");
  CREATE INDEX "equipe_photo_idx" ON "equipe" USING btree ("photo_id");
  CREATE INDEX "equipe_updated_at_idx" ON "equipe" USING btree ("updated_at");
  CREATE INDEX "equipe_created_at_idx" ON "equipe" USING btree ("created_at");
  CREATE INDEX "faq_updated_at_idx" ON "faq" USING btree ("updated_at");
  CREATE INDEX "faq_created_at_idx" ON "faq" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_realisations_fk" FOREIGN KEY ("realisations_id") REFERENCES "public"."realisations"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_temoignages_fk" FOREIGN KEY ("temoignages_id") REFERENCES "public"."temoignages"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_equipe_fk" FOREIGN KEY ("equipe_id") REFERENCES "public"."equipe"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_faq_fk" FOREIGN KEY ("faq_id") REFERENCES "public"."faq"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_realisations_id_idx" ON "payload_locked_documents_rels" USING btree ("realisations_id");
  CREATE INDEX "payload_locked_documents_rels_temoignages_id_idx" ON "payload_locked_documents_rels" USING btree ("temoignages_id");
  CREATE INDEX "payload_locked_documents_rels_equipe_id_idx" ON "payload_locked_documents_rels" USING btree ("equipe_id");
  CREATE INDEX "payload_locked_documents_rels_faq_id_idx" ON "payload_locked_documents_rels" USING btree ("faq_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "realisations_services" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "realisations_objectifs" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "realisations_resultats" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "realisations" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "realisations_rels" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "temoignages" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "equipe" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "faq" DISABLE ROW LEVEL SECURITY;
  ALTER TABLE "parametres" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "realisations_services" CASCADE;
  DROP TABLE "realisations_objectifs" CASCADE;
  DROP TABLE "realisations_resultats" CASCADE;
  DROP TABLE "realisations" CASCADE;
  DROP TABLE "realisations_rels" CASCADE;
  DROP TABLE "temoignages" CASCADE;
  DROP TABLE "equipe" CASCADE;
  DROP TABLE "faq" CASCADE;
  DROP TABLE "parametres" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_realisations_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_temoignages_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_equipe_fk";
  
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_faq_fk";
  
  DROP INDEX "payload_locked_documents_rels_realisations_id_idx";
  DROP INDEX "payload_locked_documents_rels_temoignages_id_idx";
  DROP INDEX "payload_locked_documents_rels_equipe_id_idx";
  DROP INDEX "payload_locked_documents_rels_faq_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "realisations_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "temoignages_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "equipe_id";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "faq_id";
  DROP TYPE "public"."enum_realisations_services";
  DROP TYPE "public"."enum_realisations_secteur";
  DROP TYPE "public"."enum_faq_theme";`)
}
