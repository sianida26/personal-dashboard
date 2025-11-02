-- Create notification preference related enums
CREATE TYPE "notification_preference_category" AS ENUM ('global','general','leads','projects','tasks','system');
CREATE TYPE "notification_channel" AS ENUM ('inApp','email','whatsapp','sms','push');
CREATE TYPE "notification_preference_source" AS ENUM ('default','user','override');

-- Table to store per-user notification preferences
CREATE TABLE "user_notification_preferences" (
    "id" varchar(25) PRIMARY KEY,
    "user_id" text NOT NULL REFERENCES "public"."users"("id") ON DELETE CASCADE,
    "category" "notification_preference_category" NOT NULL,
    "channel" "notification_channel" NOT NULL,
    "enabled" boolean NOT NULL DEFAULT true,
    "delivery_window" jsonb,
    "source" "notification_preference_source" NOT NULL DEFAULT 'default',
    "created_at" timestamptz NOT NULL DEFAULT NOW(),
    "updated_at" timestamptz NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX "idx_user_notification_preferences_user_category_channel"
    ON "user_notification_preferences" ("user_id", "category", "channel");
CREATE INDEX "idx_user_notification_preferences_category"
    ON "user_notification_preferences" ("category");
CREATE INDEX "idx_user_notification_preferences_channel"
    ON "user_notification_preferences" ("channel");

-- Table for system-level overrides
CREATE TABLE "notification_channel_overrides" (
    "id" varchar(25) PRIMARY KEY,
    "category" "notification_preference_category" NOT NULL,
    "channel" "notification_channel" NOT NULL,
    "enforced" boolean NOT NULL DEFAULT true,
    "reason" text,
    "effective_from" timestamptz NOT NULL DEFAULT NOW(),
    "effective_to" timestamptz,
    "created_at" timestamptz NOT NULL DEFAULT NOW(),
    "updated_at" timestamptz NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX "idx_notification_channel_overrides_category_channel"
    ON "notification_channel_overrides" ("category", "channel");

-- Seed default preferences for existing users
WITH channels AS (
    SELECT 'inApp'::"notification_channel" AS channel, true AS enabled
    UNION ALL
    SELECT 'email', true
    UNION ALL
    SELECT 'whatsapp', false
    UNION ALL
    SELECT 'sms', false
    UNION ALL
    SELECT 'push', false
)
INSERT INTO "user_notification_preferences" ("id", "user_id", "category", "channel", "enabled", "source")
SELECT
    'pref_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 20) AS id,
    u.id,
    'global'::"notification_preference_category" AS category,
    c.channel,
    c.enabled,
    'default'::"notification_preference_source" AS source
FROM "public"."users" u
CROSS JOIN channels c;
