#!/bin/bash

set -euo pipefail

# Ensure we use PostgreSQL 18 client tools (fallback to 17 if not available)
if [ -d /usr/lib/postgresql/18/bin ]; then
	export PATH=/usr/lib/postgresql/18/bin:$PATH
else
	export PATH=/usr/lib/postgresql/17/bin:$PATH
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="${ENV_FILE:-${SCRIPT_DIR}/.env}"
REMOTE_DB_DIR="${SCRIPT_DIR}/remote_db"
TIMESTAMP=$(date +%Y%m%d%H%M%S)
DUMP_FILE=""
DUMP_PATH=""
PRESERVE_DUMP=false
RESTORE_FROM_DUMP=false
RESTORE_DUMP_FILE=""
SKIP_VERSION_CHECK=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
	case $1 in
		--preserve-sql-dump)
			PRESERVE_DUMP=true
			shift
			;;
		--restore-from-dump)
			RESTORE_FROM_DUMP=true
			shift
			# Check if next argument is a file path
			if [[ $# -gt 0 && ! $1 =~ ^-- ]]; then
				RESTORE_DUMP_FILE="$1"
				shift
			fi
			;;
		--skip-version-check)
			SKIP_VERSION_CHECK=true
			shift
			;;
		*)
			echo "Unknown option: $1" >&2
			echo "Usage: $0 [--preserve-sql-dump] [--restore-from-dump [dump-file]] [--skip-version-check]" >&2
			exit 1
			;;
	esac
done

cd "$SCRIPT_DIR"

require_cmd() {
	if ! command -v "$1" >/dev/null 2>&1; then
		echo "Missing required command: $1" >&2
		exit 1
	fi
}

require_cmd python3
require_cmd pg_dump
require_cmd dropdb
require_cmd createdb
require_cmd psql

find_latest_dump() {
	local latest_dump
	latest_dump=$(find "$REMOTE_DB_DIR" -maxdepth 1 -type f -name "*.sql" -printf '%T@ %p\n' 2>/dev/null | sort -rn | head -n 1 | cut -d' ' -f2-)
	if [ -z "$latest_dump" ]; then
		echo "No dump files found in $REMOTE_DB_DIR" >&2
		exit 1
	fi
	echo "$latest_dump"
}

get_env_value() {
	local key="$1"
	local value="${!key:-}"
	if [ -n "$value" ]; then
		echo "$value"
		return
	fi
	if [ -f "$ENV_FILE" ]; then
		value=$(grep -E "^[[:space:]]*$key[[:space:]]*=" "$ENV_FILE" | tail -n 1 | cut -d= -f2-)
		value=${value%%#*}
		value=$(echo "$value" | xargs)
		echo "$value"
	fi
}

parse_postgres_url() {
	local url="$1"
	local prefix="$2"
	local parsed
	parsed=$(python3 - "$url" <<'PY'
import sys
from urllib.parse import unquote, urlparse

url = sys.argv[1]
parsed = urlparse(url)
if parsed.scheme not in {"postgres", "postgresql"}:
    sys.exit("Invalid Postgres URL: %s" % url)
if not parsed.hostname or not parsed.path:
    sys.exit("Incomplete Postgres URL: %s" % url)
dbname = parsed.path.lstrip('/')
if not dbname:
    sys.exit("Missing database name in URL: %s" % url)
print("|".join([
    unquote(parsed.username or ""),
    unquote(parsed.password or ""),
    parsed.hostname or "",
    str(parsed.port or 5432),
    dbname,
]))
PY
	) || exit 1
	IFS="|" read -r user pass host port db <<<"$parsed"
	printf -v "${prefix}_USER" '%s' "$user"
	printf -v "${prefix}_PASS" '%s' "$pass"
	printf -v "${prefix}_HOST" '%s' "$host"
	printf -v "${prefix}_PORT" '%s' "$port"
	printf -v "${prefix}_DB" '%s' "$db"
}

REMOTE_DB_URL="${REMOTE_DB_URL:-$(get_env_value REMOTE_DB_URL)}"
LOCAL_DB_URL="${DATABASE_URL:-$(get_env_value DATABASE_URL)}"

if [ -z "$LOCAL_DB_URL" ]; then
	echo "DATABASE_URL must be set (either env var or in $ENV_FILE)." >&2
	exit 1
fi

parse_postgres_url "$LOCAL_DB_URL" LOCAL

if [ "$RESTORE_FROM_DUMP" = true ]; then
	# Determine which dump file to restore
	if [ -n "$RESTORE_DUMP_FILE" ]; then
		# Use specified dump file
		if [ ! -f "$RESTORE_DUMP_FILE" ]; then
			echo "Dump file not found: $RESTORE_DUMP_FILE" >&2
			exit 1
		fi
		DUMP_PATH="$RESTORE_DUMP_FILE"
	else
		# Find latest dump file
		mkdir -p "$REMOTE_DB_DIR"
		DUMP_PATH=$(find_latest_dump)
	fi
	DUMP_FILE=$(basename "$DUMP_PATH")
else
	# Dump mode - need remote DB URL
	if [ -z "$REMOTE_DB_URL" ]; then
		echo "REMOTE_DB_URL must be set (either env var or in $ENV_FILE)." >&2
		exit 1
	fi
	parse_postgres_url "$REMOTE_DB_URL" REMOTE
	# Create remote_db directory and set dump path
	mkdir -p "$REMOTE_DB_DIR"
	DUMP_FILE="${REMOTE_DB}_${TIMESTAMP}_backup.sql"
	DUMP_PATH="${REMOTE_DB_DIR}/${DUMP_FILE}"
fi

case "$LOCAL_HOST" in
	localhost|127.0.0.1|::1) ;;
	*)
		echo "Refusing to overwrite non-local database host '$LOCAL_HOST'." >&2
		exit 1
		;;
esac

# Display what will be done
echo "=========================================="
echo "Database Synchronization Script"
echo "=========================================="
echo ""
if [ "$RESTORE_FROM_DUMP" = true ]; then
	echo "Operation: RESTORE FROM DUMP"
	echo "Source: $DUMP_PATH"
else
	echo "Operation: DUMP AND RESTORE"
	echo "Remote Database: $REMOTE_DB @ $REMOTE_HOST:$REMOTE_PORT"
	echo "Dump will be saved to: $DUMP_PATH"
fi
echo "Target Local Database: $LOCAL_DB @ $LOCAL_HOST:$LOCAL_PORT"
echo ""
echo "WARNING: This will:"
echo "  1. DROP the local database '$LOCAL_DB'"
echo "  2. CREATE a new empty database '$LOCAL_DB'"
if [ "$RESTORE_FROM_DUMP" = true ]; then
	echo "  3. RESTORE data from the dump file"
else
	echo "  3. DUMP data from remote database (excluding observability_events and request_details)"
	echo "  4. RESTORE the dumped data into local database"
fi
echo ""
echo "ALL EXISTING DATA IN '$LOCAL_DB' WILL BE LOST!"
echo "=========================================="
echo ""
read -p "Do you want to proceed? (yes/no): " -r
echo ""
if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
	echo "Operation cancelled."
	exit 0
fi

# Check for active connections to local database
ACTIVE_CONNECTIONS=$(PGPASSWORD="$LOCAL_PASS" psql \
	--host "$LOCAL_HOST" \
	--port "$LOCAL_PORT" \
	--username "$LOCAL_USER" \
	--dbname "$LOCAL_DB" \
	--tuples-only \
	--no-align \
	--command "SELECT COUNT(*) FROM pg_stat_activity WHERE datname = current_database() AND pid != pg_backend_pid();" 2>/dev/null || echo "0")

if [ "$ACTIVE_CONNECTIONS" -gt 0 ]; then
	echo "ERROR: Database '$LOCAL_DB' has $ACTIVE_CONNECTIONS active connection(s)." >&2
	echo "Please stop your application (backend/frontend) before running this script." >&2
	echo "" >&2
	echo "Active connections:" >&2
	PGPASSWORD="$LOCAL_PASS" psql \
		--host "$LOCAL_HOST" \
		--port "$LOCAL_PORT" \
		--username "$LOCAL_USER" \
		--dbname "$LOCAL_DB" \
		--command "SELECT pid, usename, application_name, state, query_start FROM pg_stat_activity WHERE datname = current_database() AND pid != pg_backend_pid();" >&2
	exit 1
fi

cleanup() {
	if [ "$PRESERVE_DUMP" = false ]; then
		rm -f "$DUMP_PATH"
	else
		echo "SQL dump preserved at: $DUMP_PATH"
	fi
}
trap cleanup EXIT

if [ "$RESTORE_FROM_DUMP" = true ]; then
	echo "Restoring from existing dump file: $DUMP_PATH"
else
	REMOTE_VERSION=$(PGPASSWORD="$REMOTE_PASS" psql \
		--host "$REMOTE_HOST" \
		--port "$REMOTE_PORT" \
		--username "$REMOTE_USER" \
		--dbname "$REMOTE_DB" \
		--tuples-only \
		--no-align \
		--command "SHOW server_version;" | tr -d '[:space:]')

	if [ -z "$REMOTE_VERSION" ]; then
		echo "Unable to determine remote PostgreSQL version." >&2
		exit 1
	fi

	REMOTE_MAJOR="${REMOTE_VERSION%%.*}"
	LOCAL_PGDUMP_VERSION=$(pg_dump --version | awk '{print $3}')
	LOCAL_PGDUMP_MAJOR="${LOCAL_PGDUMP_VERSION%%.*}"
	USE_DOCKER=false

	if [ "$SKIP_VERSION_CHECK" = false ] && [ "$REMOTE_MAJOR" != "$LOCAL_PGDUMP_MAJOR" ]; then
		echo "pg_dump major version ($LOCAL_PGDUMP_MAJOR) does not match remote server version ($REMOTE_MAJOR)." >&2
		echo "" >&2
		echo "Options:" >&2
		echo "  1. Run with --skip-version-check flag (pg_dump often works across versions)" >&2
		echo "  2. Install pg_dump $REMOTE_MAJOR" >&2
		echo "  3. Use Docker (requires docker group access)" >&2
		echo "" >&2
		if command -v docker >/dev/null 2>&1; then
			USE_DOCKER=true
		else
			echo "Docker not found. Use --skip-version-check or install pg_dump $REMOTE_MAJOR." >&2
			exit 1
		fi
	elif [ "$SKIP_VERSION_CHECK" = true ] && [ "$REMOTE_MAJOR" != "$LOCAL_PGDUMP_MAJOR" ]; then
		echo "WARNING: Using pg_dump $LOCAL_PGDUMP_MAJOR with PostgreSQL $REMOTE_MAJOR server." >&2
		echo "This may work, but could have compatibility issues." >&2
		echo "" >&2
	fi

	check_docker_access() {
		if ! docker info >/dev/null 2>&1; then
			echo "Docker is installed but not accessible for the current user." >&2
			echo "Either grant access (e.g., add your user to the docker group and relogin) or install pg_dump $REMOTE_MAJOR." >&2
			exit 1
		fi
	}

	echo "Dumping remote database '$REMOTE_DB' (server $REMOTE_VERSION)..."
	
	# Function to show progress while dumping
	show_dump_progress() {
		local dump_file="$1"
		local pid="$2"
		echo -n "Progress: "
		while kill -0 "$pid" 2>/dev/null; do
			if [ -f "$dump_file" ]; then
				local size=$(du -h "$dump_file" 2>/dev/null | cut -f1)
				echo -ne "\rProgress: ${size} dumped..."
			fi
			sleep 2
		done
		echo ""
	}
	
	if [ "$USE_DOCKER" = true ]; then
		check_docker_access
		DUMP_BASENAME=$(basename "$DUMP_PATH")
		DOCKER_IMAGE="postgres:${REMOTE_MAJOR}"
		echo "Using Docker image '$DOCKER_IMAGE' for pg_dump compatibility..."
		docker run --rm \
			-e PGPASSWORD="$REMOTE_PASS" \
			-v "$SCRIPT_DIR":/dumpdir \
			"$DOCKER_IMAGE" \
			pg_dump \
			--no-owner \
			--exclude-table-data=observability_events \
			--exclude-table-data=request_details \
			--host "$REMOTE_HOST" \
			--port "$REMOTE_PORT" \
			--username "$REMOTE_USER" \
			--dbname "$REMOTE_DB" \
			--file "/dumpdir/$DUMP_BASENAME"
	else
		# Disable version check if skipping version validation
		if [ "$SKIP_VERSION_CHECK" = true ]; then
			export PGGROUPREADWRITE=1  # Suppress some warnings
		fi
		
		# Check if pv is available for progress bar
		if command -v pv >/dev/null 2>&1; then
			PGPASSWORD="$REMOTE_PASS" pg_dump \
				--no-owner \
				--exclude-table-data=observability_events \
				--exclude-table-data=request_details \
				--host "$REMOTE_HOST" \
				--port "$REMOTE_PORT" \
				--username "$REMOTE_USER" \
				--dbname "$REMOTE_DB" \
				--no-sync | pv -p -t -e -r -b > "$DUMP_PATH"
		else
			# Fallback: run in background and show file size progress
			PGPASSWORD="$REMOTE_PASS" pg_dump \
				--no-owner \
				--exclude-table-data=observability_events \
				--exclude-table-data=request_details \
				--host "$REMOTE_HOST" \
				--port "$REMOTE_PORT" \
				--username "$REMOTE_USER" \
				--dbname "$REMOTE_DB" \
				--file "$DUMP_PATH" \
				--no-sync &
			DUMP_PID=$!
			show_dump_progress "$DUMP_PATH" "$DUMP_PID"
			wait "$DUMP_PID"
		fi
	fi
fi

echo "Dropping local database '$LOCAL_DB'..."
PGPASSWORD="$LOCAL_PASS" dropdb \
	--if-exists \
	--host "$LOCAL_HOST" \
	--port "$LOCAL_PORT" \
	--username "$LOCAL_USER" \
	"$LOCAL_DB"

echo "Creating local database '$LOCAL_DB'..."
PGPASSWORD="$LOCAL_PASS" createdb \
	--host "$LOCAL_HOST" \
	--port "$LOCAL_PORT" \
	--username "$LOCAL_USER" \
	"$LOCAL_DB"

echo "Restoring database dump into '$LOCAL_DB'..."
if command -v pv >/dev/null 2>&1; then
	pv "$DUMP_PATH" | PGPASSWORD="$LOCAL_PASS" psql \
		--host "$LOCAL_HOST" \
		--port "$LOCAL_PORT" \
		--username "$LOCAL_USER" \
		--dbname "$LOCAL_DB" \
		>/dev/null
else
	PGPASSWORD="$LOCAL_PASS" psql \
		--host "$LOCAL_HOST" \
		--port "$LOCAL_PORT" \
		--username "$LOCAL_USER" \
		--dbname "$LOCAL_DB" \
		--file "$DUMP_PATH"
fi

echo "Database synchronization complete!"
