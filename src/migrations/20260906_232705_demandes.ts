import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_demandes_type_formulaire" AS ENUM('contact', 'devis-service', 'devis-flotte', 'rappel');
  CREATE TYPE "public"."enum_demandes_statut_traitement" AS ENUM('nouveau', 'en-cours', 'traite');
  CREATE TABLE "demandes" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"type_formulaire" "enum_demandes_type_formulaire" NOT NULL,
  	"nom" varchar NOT NULL,
  	"telephone" varchar NOT NULL,
  	"email" varchar,
  	"entreprise" varchar,
  	"sujet" varchar,
  	"service" varchar,
  	"budget" varchar,
  	"effectif" varchar,
  	"creneau" varchar,
  	"message" varchar,
  	"page_source" varchar,
  	"consentement" boolean DEFAULT false NOT NULL,
  	"statut_traitement" "enum_demandes_statut_traitement" DEFAULT 'nouveau' NOT NULL,
  	"notes" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  ALTER TABLE "payload_locked_documents_rels" ADD COLUMN "demandes_id" integer;
  CREATE INDEX "demandes_type_formulaire_idx" ON "demandes" USING btree ("type_formulaire");
  CREATE INDEX "demandes_statut_traitement_idx" ON "demandes" USING btree ("statut_traitement");
  CREATE INDEX "demandes_updated_at_idx" ON "demandes" USING btree ("updated_at");
  CREATE INDEX "demandes_created_at_idx" ON "demandes" USING btree ("created_at");
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_demandes_fk" FOREIGN KEY ("demandes_id") REFERENCES "public"."demandes"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "payload_locked_documents_rels_demandes_id_idx" ON "payload_locked_documents_rels" USING btree ("demandes_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "demandes" DISABLE ROW LEVEL SECURITY;
  DROP TABLE "demandes" CASCADE;
  ALTER TABLE "payload_locked_documents_rels" DROP CONSTRAINT "payload_locked_documents_rels_demandes_fk";
  
  DROP INDEX "payload_locked_documents_rels_demandes_id_idx";
  ALTER TABLE "payload_locked_documents_rels" DROP COLUMN "demandes_id";
  DROP TYPE "public"."enum_demandes_type_formulaire";
  DROP TYPE "public"."enum_demandes_statut_traitement";`)
}
