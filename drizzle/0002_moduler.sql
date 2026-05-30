CREATE TYPE "public"."activity_source" AS ENUM('gfgk', 'ak_golf');--> statement-breakpoint
CREATE TYPE "public"."activity_type" AS ENUM('turnering', 'kurs', 'intern', 'sosial');--> statement-breakpoint
CREATE TYPE "public"."announcement_audience" AS ENUM('alle', 'admin', 'ansatt');--> statement-breakpoint
CREATE TYPE "public"."article_category" AS ENUM('medlemskap', 'drift', 'faq', 'prosedyrer', 'annet');--> statement-breakpoint
CREATE TYPE "public"."checklist_repeat" AS ENUM('daglig', 'ukentlig', 'manedlig');--> statement-breakpoint
CREATE TYPE "public"."checklist_role" AS ENUM('ansatt', 'admin', 'alle');--> statement-breakpoint
CREATE TYPE "public"."document_category" AS ENUM('kontrakt', 'ferieattest', 'sykmelding', 'kvittering', 'annet');--> statement-breakpoint
CREATE TYPE "public"."inbox_status" AS ENUM('new', 'draft_ready', 'sent', 'manual', 'archived');--> statement-breakpoint
CREATE TYPE "public"."project_cover" AS ENUM('gold', 'teal', 'red', 'black');--> statement-breakpoint
CREATE TYPE "public"."project_member_role" AS ENUM('eier', 'medlem');--> statement-breakpoint
CREATE TYPE "public"."shift_event_category" AS ENUM('hendelse', 'klage', 'maskin', 'observasjon', 'annet');--> statement-breakpoint
CREATE TYPE "public"."shift_event_severity" AS ENUM('info', 'medium', 'hoy');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('low', 'medium', 'high');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('todo', 'in_progress', 'waiting', 'done');--> statement-breakpoint
CREATE TYPE "public"."time_off_status" AS ENUM('pending', 'approved', 'declined');--> statement-breakpoint
CREATE TYPE "public"."time_off_type" AS ENUM('ferie', 'sykemelding', 'permisjon');--> statement-breakpoint
ALTER TYPE "public"."project_status" ADD VALUE 'arkivert';--> statement-breakpoint
CREATE TABLE "activities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"type" "activity_type" DEFAULT 'intern' NOT NULL,
	"source" "activity_source" DEFAULT 'gfgk' NOT NULL,
	"external_id" text,
	"start_at" timestamp with time zone NOT NULL,
	"end_at" timestamp with time zone NOT NULL,
	"location" text,
	"url" text,
	"created_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "announcement_reads" (
	"announcement_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"read_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "announcement_reads_announcement_id_user_id_pk" PRIMARY KEY("announcement_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"audience" "announcement_audience" DEFAULT 'alle' NOT NULL,
	"pinned" boolean DEFAULT false NOT NULL,
	"expires_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "articles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"slug" text NOT NULL,
	"title" text NOT NULL,
	"category" "article_category" DEFAULT 'annet' NOT NULL,
	"body" text NOT NULL,
	"published" boolean DEFAULT true NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_by" uuid,
	CONSTRAINT "articles_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "attachments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"blob_url" text NOT NULL,
	"filename" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checklist_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"checklist_id" uuid NOT NULL,
	"title" text NOT NULL,
	"description" text,
	"order_index" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "checklist_run_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"item_id" uuid NOT NULL,
	"done" boolean DEFAULT false NOT NULL,
	"done_at" timestamp with time zone,
	"done_by" uuid,
	"note" text
);
--> statement-breakpoint
CREATE TABLE "checklist_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"checklist_id" uuid NOT NULL,
	"date" date NOT NULL,
	"completed_by" uuid,
	"completed_at" timestamp with time zone,
	CONSTRAINT "checklist_runs_checklist_id_date_uniq" UNIQUE("checklist_id","date")
);
--> statement-breakpoint
CREATE TABLE "checklists" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text,
	"repeat" "checklist_repeat" DEFAULT 'daglig' NOT NULL,
	"weekdays" text[],
	"assigned_role" "checklist_role" DEFAULT 'ansatt' NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"category" "document_category" NOT NULL,
	"name" text NOT NULL,
	"blob_url" text NOT NULL,
	"mime_type" text NOT NULL,
	"size_bytes" integer NOT NULL,
	"uploaded_by" uuid NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" date
);
--> statement-breakpoint
CREATE TABLE "inbox_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"external_id" text NOT NULL,
	"from_email" text NOT NULL,
	"from_name" text,
	"to_email" text NOT NULL,
	"subject" text NOT NULL,
	"body_text" text,
	"body_html" text,
	"received_at" timestamp with time zone NOT NULL,
	"status" "inbox_status" DEFAULT 'new' NOT NULL,
	"ai_draft" text,
	"ai_skill_used" text,
	"sent_at" timestamp with time zone,
	"sent_by" uuid,
	"thread_id" text,
	CONSTRAINT "inbox_messages_external_id_unique" UNIQUE("external_id")
);
--> statement-breakpoint
CREATE TABLE "inbox_skills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"description" text NOT NULL,
	"prompt" text NOT NULL,
	"example_response" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "project_members" (
	"project_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"role" "project_member_role" DEFAULT 'medlem' NOT NULL,
	"added_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "project_members_project_id_user_id_pk" PRIMARY KEY("project_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "shift_clocks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"shift_id" uuid,
	"clocked_in_at" timestamp with time zone NOT NULL,
	"clocked_out_at" timestamp with time zone,
	"hours" numeric(4, 2),
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"shift_id" uuid,
	"user_id" uuid NOT NULL,
	"category" "shift_event_category" NOT NULL,
	"body" text NOT NULL,
	"severity" "shift_event_severity" DEFAULT 'info' NOT NULL,
	"attachments" text[],
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "shift_templates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"start_time" text NOT NULL,
	"end_time" text NOT NULL,
	"hours" numeric(4, 1) NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_assignees" (
	"task_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "task_assignees_task_id_user_id_pk" PRIMARY KEY("task_id","user_id")
);
--> statement-breakpoint
CREATE TABLE "task_comments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"task_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"body" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "time_off" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"type" time_off_type DEFAULT 'ferie' NOT NULL,
	"status" time_off_status DEFAULT 'pending' NOT NULL,
	"note" text,
	"approved_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "tasks" DROP CONSTRAINT "tasks_assigned_to_users_id_fk";
--> statement-breakpoint
ALTER TABLE "tasks" ALTER COLUMN "project_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "cover_color" "project_cover" DEFAULT 'gold' NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "projects" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "parent_id" uuid;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "status" "task_status" DEFAULT 'todo' NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "priority" "task_priority" DEFAULT 'medium' NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "start_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "end_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "due_date" date;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "order_index" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "updated_at" timestamp with time zone DEFAULT now() NOT NULL;--> statement-breakpoint
ALTER TABLE "tasks" ADD COLUMN "updated_by" uuid;--> statement-breakpoint
ALTER TABLE "activities" ADD CONSTRAINT "activities_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_announcement_id_announcements_id_fk" FOREIGN KEY ("announcement_id") REFERENCES "public"."announcements"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcement_reads" ADD CONSTRAINT "announcement_reads_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "articles" ADD CONSTRAINT "articles_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_items" ADD CONSTRAINT "checklist_items_checklist_id_checklists_id_fk" FOREIGN KEY ("checklist_id") REFERENCES "public"."checklists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_run_items" ADD CONSTRAINT "checklist_run_items_run_id_checklist_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."checklist_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_run_items" ADD CONSTRAINT "checklist_run_items_item_id_checklist_items_id_fk" FOREIGN KEY ("item_id") REFERENCES "public"."checklist_items"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_run_items" ADD CONSTRAINT "checklist_run_items_done_by_users_id_fk" FOREIGN KEY ("done_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_runs" ADD CONSTRAINT "checklist_runs_checklist_id_checklists_id_fk" FOREIGN KEY ("checklist_id") REFERENCES "public"."checklists"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklist_runs" ADD CONSTRAINT "checklist_runs_completed_by_users_id_fk" FOREIGN KEY ("completed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "checklists" ADD CONSTRAINT "checklists_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inbox_messages" ADD CONSTRAINT "inbox_messages_sent_by_users_id_fk" FOREIGN KEY ("sent_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_project_id_projects_id_fk" FOREIGN KEY ("project_id") REFERENCES "public"."projects"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "project_members" ADD CONSTRAINT "project_members_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_clocks" ADD CONSTRAINT "shift_clocks_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_clocks" ADD CONSTRAINT "shift_clocks_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_events" ADD CONSTRAINT "shift_events_shift_id_shifts_id_fk" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "shift_events" ADD CONSTRAINT "shift_events_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_assignees" ADD CONSTRAINT "task_assignees_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_assignees" ADD CONSTRAINT "task_assignees_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_task_id_tasks_id_fk" FOREIGN KEY ("task_id") REFERENCES "public"."tasks"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "task_comments" ADD CONSTRAINT "task_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_off" ADD CONSTRAINT "time_off_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "time_off" ADD CONSTRAINT "time_off_approved_by_users_id_fk" FOREIGN KEY ("approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projects" ADD CONSTRAINT "projects_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "assigned_to";--> statement-breakpoint
ALTER TABLE "tasks" DROP COLUMN "done";