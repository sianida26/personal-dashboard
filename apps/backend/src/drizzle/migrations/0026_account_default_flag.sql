ALTER TABLE "money_accounts"
ADD COLUMN IF NOT EXISTS "is_default" boolean NOT NULL DEFAULT false;

WITH ranked_accounts AS (
	SELECT
		id,
		ROW_NUMBER() OVER (
			PARTITION BY user_id
			ORDER BY
				CASE WHEN is_active THEN 0 ELSE 1 END,
				CASE WHEN lower(name) = 'kas' THEN 0 ELSE 1 END,
				created_at ASC NULLS LAST,
				id ASC
		) AS rank
	FROM "money_accounts"
)
UPDATE "money_accounts" AS m
SET "is_default" = ranked_accounts.rank = 1
FROM ranked_accounts
WHERE m.id = ranked_accounts.id;

CREATE UNIQUE INDEX IF NOT EXISTS "uq_money_accounts_default_per_user"
	ON "money_accounts" ("user_id")
	WHERE "is_default" = true;
