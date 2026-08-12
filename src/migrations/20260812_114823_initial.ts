import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_blog_categorie" AS ENUM('branding', 'marketing-digital', 'ia', 'carte-digitale', 'agence');
  CREATE TABLE "users_sessions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"created_at" timestamp(3) with time zone,
  	"expires_at" timestamp(3) with time zone NOT NULL
  );
  
  CREATE TABLE "users" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"email" varchar NOT NULL,
  	"reset_password_token" varchar,
  	"reset_password_expiration" timestamp(3) with time zone,
  	"salt" varchar,
  	"hash" varchar,
  	"login_attempts" numeric DEFAULT 0,
  	"lock_until" timestamp(3) with time zone
  );
  
  CREATE TABLE "media" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"alt" varchar NOT NULL,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"url" varchar,
  	"thumbnail_u_r_l" varchar,
  	"filename" varchar,
  	"mime_type" varchar,
  	"filesize" numeric,
  	"width" numeric,
  	"height" numeric
  );
  
  CREATE TABLE "blog" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"titre" varchar NOT NULL,
  	"slug" varchar,
  	"categorie" "enum_blog_categorie" DEFAULT 'agence',
  	"date" timestamp(3) with time zone,
  	"image_id" integer,
  	"extrait" varchar,
  	"temps_lecture" numeric DEFAULT 5,
  	"auteur" varchar DEFAULT 'L''équipe OPTINOV',
  	"a_la_une" boolean DEFAULT false,
  	"service_lie" varchar,
  	"landing_liee" varchar,
  	"body" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_kv" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar NOT NULL,
  	"data" jsonb NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"global_slug" varchar,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_locked_documents_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer,
  	"media_id" integer,
  	"blog_id" integer
  );
  
  CREATE TABLE "payload_preferences" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"key" varchar,
  	"value" jsonb,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "payload_preferences_rels" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"order" integer,
  	"parent_id" integer NOT NULL,
  	"path" varchar NOT NULL,
  	"users_id" integer
  );
  
  CREATE TABLE "payload_migrations" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"name" varchar,
  	"batch" numeric,
  	"updated_at" timestamp(3) with time zone DEFAULT now() NOT NULL,
  	"created_at" timestamp(3) with time zone DEFAULT now() NOT NULL
  );
  
  CREATE TABLE "service_images" (
  	"id" serial PRIMARY KEY NOT NULL,
  	"communication_visuelle_img1_id" integer,
  	"communication_visuelle_img2_id" integer,
  	"communication_visuelle_img3_id" integer,
  	"communication_digitale_img1_id" integer,
  	"communication_digitale_img2_id" integer,
  	"communication_digitale_img3_id" integer,
  	"marketing_strategie_img1_id" integer,
  	"marketing_strategie_img2_id" integer,
  	"marketing_strategie_img3_id" integer,
  	"automatisation_ia_img1_id" integer,
  	"automatisation_ia_img2_id" integer,
  	"automatisation_ia_img3_id" integer,
  	"photo_video_img1_id" integer,
  	"photo_video_img2_id" integer,
  	"photo_video_img3_id" integer,
  	"updated_at" timestamp(3) with time zone,
  	"created_at" timestamp(3) with time zone
  );
  
  ALTER TABLE "users_sessions" ADD CONSTRAINT "users_sessions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "blog" ADD CONSTRAINT "blog_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_locked_documents"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_media_fk" FOREIGN KEY ("media_id") REFERENCES "public"."media"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_locked_documents_rels" ADD CONSTRAINT "payload_locked_documents_rels_blog_fk" FOREIGN KEY ("blog_id") REFERENCES "public"."blog"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_parent_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."payload_preferences"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "payload_preferences_rels" ADD CONSTRAINT "payload_preferences_rels_users_fk" FOREIGN KEY ("users_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
  ALTER TABLE "service_images" ADD CONSTRAINT "service_images_communication_visuelle_img1_id_media_id_fk" FOREIGN KEY ("communication_visuelle_img1_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "service_images" ADD CONSTRAINT "service_images_communication_visuelle_img2_id_media_id_fk" FOREIGN KEY ("communication_visuelle_img2_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "service_images" ADD CONSTRAINT "service_images_communication_visuelle_img3_id_media_id_fk" FOREIGN KEY ("communication_visuelle_img3_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "service_images" ADD CONSTRAINT "service_images_communication_digitale_img1_id_media_id_fk" FOREIGN KEY ("communication_digitale_img1_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "service_images" ADD CONSTRAINT "service_images_communication_digitale_img2_id_media_id_fk" FOREIGN KEY ("communication_digitale_img2_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "service_images" ADD CONSTRAINT "service_images_communication_digitale_img3_id_media_id_fk" FOREIGN KEY ("communication_digitale_img3_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "service_images" ADD CONSTRAINT "service_images_marketing_strategie_img1_id_media_id_fk" FOREIGN KEY ("marketing_strategie_img1_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "service_images" ADD CONSTRAINT "service_images_marketing_strategie_img2_id_media_id_fk" FOREIGN KEY ("marketing_strategie_img2_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "service_images" ADD CONSTRAINT "service_images_marketing_strategie_img3_id_media_id_fk" FOREIGN KEY ("marketing_strategie_img3_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "service_images" ADD CONSTRAINT "service_images_automatisation_ia_img1_id_media_id_fk" FOREIGN KEY ("automatisation_ia_img1_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "service_images" ADD CONSTRAINT "service_images_automatisation_ia_img2_id_media_id_fk" FOREIGN KEY ("automatisation_ia_img2_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "service_images" ADD CONSTRAINT "service_images_automatisation_ia_img3_id_media_id_fk" FOREIGN KEY ("automatisation_ia_img3_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "service_images" ADD CONSTRAINT "service_images_photo_video_img1_id_media_id_fk" FOREIGN KEY ("photo_video_img1_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "service_images" ADD CONSTRAINT "service_images_photo_video_img2_id_media_id_fk" FOREIGN KEY ("photo_video_img2_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "service_images" ADD CONSTRAINT "service_images_photo_video_img3_id_media_id_fk" FOREIGN KEY ("photo_video_img3_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  CREATE INDEX "users_sessions_order_idx" ON "users_sessions" USING btree ("_order");
  CREATE INDEX "users_sessions_parent_id_idx" ON "users_sessions" USING btree ("_parent_id");
  CREATE INDEX "users_updated_at_idx" ON "users" USING btree ("updated_at");
  CREATE INDEX "users_created_at_idx" ON "users" USING btree ("created_at");
  CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");
  CREATE INDEX "media_updated_at_idx" ON "media" USING btree ("updated_at");
  CREATE INDEX "media_created_at_idx" ON "media" USING btree ("created_at");
  CREATE UNIQUE INDEX "media_filename_idx" ON "media" USING btree ("filename");
  CREATE INDEX "blog_image_idx" ON "blog" USING btree ("image_id");
  CREATE INDEX "blog_updated_at_idx" ON "blog" USING btree ("updated_at");
  CREATE INDEX "blog_created_at_idx" ON "blog" USING btree ("created_at");
  CREATE UNIQUE INDEX "payload_kv_key_idx" ON "payload_kv" USING btree ("key");
  CREATE INDEX "payload_locked_documents_global_slug_idx" ON "payload_locked_documents" USING btree ("global_slug");
  CREATE INDEX "payload_locked_documents_updated_at_idx" ON "payload_locked_documents" USING btree ("updated_at");
  CREATE INDEX "payload_locked_documents_created_at_idx" ON "payload_locked_documents" USING btree ("created_at");
  CREATE INDEX "payload_locked_documents_rels_order_idx" ON "payload_locked_documents_rels" USING btree ("order");
  CREATE INDEX "payload_locked_documents_rels_parent_idx" ON "payload_locked_documents_rels" USING btree ("parent_id");
  CREATE INDEX "payload_locked_documents_rels_path_idx" ON "payload_locked_documents_rels" USING btree ("path");
  CREATE INDEX "payload_locked_documents_rels_users_id_idx" ON "payload_locked_documents_rels" USING btree ("users_id");
  CREATE INDEX "payload_locked_documents_rels_media_id_idx" ON "payload_locked_documents_rels" USING btree ("media_id");
  CREATE INDEX "payload_locked_documents_rels_blog_id_idx" ON "payload_locked_documents_rels" USING btree ("blog_id");
  CREATE INDEX "payload_preferences_key_idx" ON "payload_preferences" USING btree ("key");
  CREATE INDEX "payload_preferences_updated_at_idx" ON "payload_preferences" USING btree ("updated_at");
  CREATE INDEX "payload_preferences_created_at_idx" ON "payload_preferences" USING btree ("created_at");
  CREATE INDEX "payload_preferences_rels_order_idx" ON "payload_preferences_rels" USING btree ("order");
  CREATE INDEX "payload_preferences_rels_parent_idx" ON "payload_preferences_rels" USING btree ("parent_id");
  CREATE INDEX "payload_preferences_rels_path_idx" ON "payload_preferences_rels" USING btree ("path");
  CREATE INDEX "payload_preferences_rels_users_id_idx" ON "payload_preferences_rels" USING btree ("users_id");
  CREATE INDEX "payload_migrations_updated_at_idx" ON "payload_migrations" USING btree ("updated_at");
  CREATE INDEX "payload_migrations_created_at_idx" ON "payload_migrations" USING btree ("created_at");
  CREATE INDEX "service_images_communication_visuelle_communication_visu_idx" ON "service_images" USING btree ("communication_visuelle_img1_id");
  CREATE INDEX "service_images_communication_visuelle_communication_vi_1_idx" ON "service_images" USING btree ("communication_visuelle_img2_id");
  CREATE INDEX "service_images_communication_visuelle_communication_vi_2_idx" ON "service_images" USING btree ("communication_visuelle_img3_id");
  CREATE INDEX "service_images_communication_digitale_communication_digi_idx" ON "service_images" USING btree ("communication_digitale_img1_id");
  CREATE INDEX "service_images_communication_digitale_communication_di_1_idx" ON "service_images" USING btree ("communication_digitale_img2_id");
  CREATE INDEX "service_images_communication_digitale_communication_di_2_idx" ON "service_images" USING btree ("communication_digitale_img3_id");
  CREATE INDEX "service_images_marketing_strategie_marketing_strategie_i_idx" ON "service_images" USING btree ("marketing_strategie_img1_id");
  CREATE INDEX "service_images_marketing_strategie_marketing_strategie_1_idx" ON "service_images" USING btree ("marketing_strategie_img2_id");
  CREATE INDEX "service_images_marketing_strategie_marketing_strategie_2_idx" ON "service_images" USING btree ("marketing_strategie_img3_id");
  CREATE INDEX "service_images_automatisation_ia_automatisation_ia_img1_idx" ON "service_images" USING btree ("automatisation_ia_img1_id");
  CREATE INDEX "service_images_automatisation_ia_automatisation_ia_img2_idx" ON "service_images" USING btree ("automatisation_ia_img2_id");
  CREATE INDEX "service_images_automatisation_ia_automatisation_ia_img3_idx" ON "service_images" USING btree ("automatisation_ia_img3_id");
  CREATE INDEX "service_images_photo_video_photo_video_img1_idx" ON "service_images" USING btree ("photo_video_img1_id");
  CREATE INDEX "service_images_photo_video_photo_video_img2_idx" ON "service_images" USING btree ("photo_video_img2_id");
  CREATE INDEX "service_images_photo_video_photo_video_img3_idx" ON "service_images" USING btree ("photo_video_img3_id");`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "users_sessions" CASCADE;
  DROP TABLE "users" CASCADE;
  DROP TABLE "media" CASCADE;
  DROP TABLE "blog" CASCADE;
  DROP TABLE "payload_kv" CASCADE;
  DROP TABLE "payload_locked_documents" CASCADE;
  DROP TABLE "payload_locked_documents_rels" CASCADE;
  DROP TABLE "payload_preferences" CASCADE;
  DROP TABLE "payload_preferences_rels" CASCADE;
  DROP TABLE "payload_migrations" CASCADE;
  DROP TABLE "service_images" CASCADE;
  DROP TYPE "public"."enum_blog_categorie";`)
}
