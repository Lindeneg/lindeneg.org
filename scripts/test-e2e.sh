#!/usr/bin/env bash

export NODE_ENV=test

if [[ ! -f .env.test ]]; then
    echo "missing .env.test, copy .env.test.example to get started"
    exit 1
fi

set -a
source .env.test
set +a

DB_DIR=$(dirname "${DATABASE_URL#file:}")

# guard against wiping a non-test database, e.g. file:./data/local.db resolves to ./data
if [[ "$DB_DIR" != *test* ]]; then
    echo "refusing to remove $DB_DIR, the test DATABASE_URL must live in a directory containing 'test'"
    exit 1
fi

echo removing old db at $DB_DIR
rm -rf "$DB_DIR"
mkdir -p "$DB_DIR"

echo migrating test db
npx prisma migrate deploy || exit 1

URL="http://localhost:$PORT/admin/login"
TIMEOUT=15

ping_until_success() {
    echo pinging $URL
    local start_time=$(date +%s)
    while true; do
        if [[ $(curl -s -o /dev/null -w "%{http_code}" $URL) == "200" ]]; then
            return 0
        fi
        local current_time=$(date +%s)
        if [ $((current_time - start_time)) -ge $TIMEOUT ]; then
            echo "Timeout reached without receiving 200 OK"
            return 1
        fi
        sleep 1
    done
}

kill_server() {
    case "$(uname -s)" in
        MINGW* | MSYS* | CYGWIN*)
            # $! is an msys pid on windows, so look up the native pid listening on the port
            local pid=$(netstat -ano | grep ":$PORT" | grep LISTENING | awk '{print $5}' | head -1)
            if [ -n "$pid" ]; then
                taskkill //F //PID "$pid" > /dev/null 2>&1
            fi
            ;;
        *)
            kill "$SERVER_PID" 2> /dev/null
            ;;
    esac
}

echo starting test server
# run node directly, not through npx, so $! is the server process itself
node --import tsx tests/e2e/server.ts &
SERVER_PID=$!

ping_until_success
RESULT=$?

if [[ $RESULT == 1 ]]; then
    echo "Failed to connect to $URL"
    kill_server
    exit 1
fi

npx vitest run --project e2e
EXIT_CODE=$?

kill_server
exit $EXIT_CODE
