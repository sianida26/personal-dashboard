CREATE TYPE "public"."attempt_status" AS ENUM('in_progress', 'completed', 'abandoned');--> statement-breakpoint
CREATE TYPE "public"."question_type" AS ENUM('mcq', 'multiple_select', 'input');--> statement-breakpoint
CREATE TABLE "ujian" (
	"id" text PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"max_questions" integer DEFAULT 10 NOT NULL,
	"shuffle_questions" boolean DEFAULT false,
	"shuffle_answers" boolean DEFAULT false,
	"practice_mode" boolean DEFAULT false,
	"allow_resubmit" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"created_by" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ujian_answers" (
	"id" text PRIMARY KEY NOT NULL,
	"attempt_id" text NOT NULL,
	"question_id" text NOT NULL,
	"user_answer" jsonb NOT NULL,
	"is_correct" boolean,
	"points_earned" integer DEFAULT 0,
	"answered_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ujian_attempts" (
	"id" text PRIMARY KEY NOT NULL,
	"ujian_id" text NOT NULL,
	"user_id" text NOT NULL,
	"started_at" timestamp DEFAULT now(),
	"completed_at" timestamp,
	"score" numeric(5, 2),
	"total_points" integer,
	"status" "attempt_status" DEFAULT 'in_progress' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "ujian_questions" (
	"id" text PRIMARY KEY NOT NULL,
	"ujian_id" text NOT NULL,
	"question_text" text NOT NULL,
	"question_type" "question_type" NOT NULL,
	"options" jsonb,
	"correct_answer" jsonb NOT NULL,
	"points" integer DEFAULT 1,
	"order_index" integer NOT NULL,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "ujian" ADD CONSTRAINT "ujian_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ujian_answers" ADD CONSTRAINT "ujian_answers_attempt_id_ujian_attempts_id_fk" FOREIGN KEY ("attempt_id") REFERENCES "public"."ujian_attempts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ujian_answers" ADD CONSTRAINT "ujian_answers_question_id_ujian_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."ujian_questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ujian_attempts" ADD CONSTRAINT "ujian_attempts_ujian_id_ujian_id_fk" FOREIGN KEY ("ujian_id") REFERENCES "public"."ujian"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ujian_attempts" ADD CONSTRAINT "ujian_attempts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ujian_questions" ADD CONSTRAINT "ujian_questions_ujian_id_ujian_id_fk" FOREIGN KEY ("ujian_id") REFERENCES "public"."ujian"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ujian_active" ON "ujian" USING btree ("is_active");--> statement-breakpoint
CREATE INDEX "idx_ujian_created_by" ON "ujian" USING btree ("created_by");--> statement-breakpoint
CREATE INDEX "idx_ujian_answers_attempt" ON "ujian_answers" USING btree ("attempt_id");--> statement-breakpoint
CREATE INDEX "idx_ujian_answers_attempt_question" ON "ujian_answers" USING btree ("attempt_id","question_id");--> statement-breakpoint
CREATE INDEX "idx_ujian_attempts_user_ujian" ON "ujian_attempts" USING btree ("user_id","ujian_id");--> statement-breakpoint
CREATE INDEX "idx_ujian_attempts_status" ON "ujian_attempts" USING btree ("status");--> statement-breakpoint
CREATE INDEX "idx_ujian_questions_ujian_id" ON "ujian_questions" USING btree ("ujian_id");--> statement-breakpoint
CREATE INDEX "idx_ujian_questions_order" ON "ujian_questions" USING btree ("ujian_id","order_index");