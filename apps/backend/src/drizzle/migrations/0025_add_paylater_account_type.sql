DO $$
BEGIN
	IF EXISTS (
		SELECT 1
		FROM pg_type t
		JOIN pg_namespace n ON n.oid = t.typnamespace
		WHERE n.nspname = 'public'
			AND t.typname = 'account_type'
	) THEN
		ALTER TYPE "public"."account_type" ADD VALUE IF NOT EXISTS 'paylater';
	END IF;
END
$$;
