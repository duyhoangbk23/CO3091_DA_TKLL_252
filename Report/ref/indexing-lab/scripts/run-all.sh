#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "Starting MySQL and MongoDB containers..."
docker compose up -d

echo "Waiting for MySQL to become healthy..."
until docker compose exec -T mysql mysqladmin ping -uroot -proot --silent >/dev/null 2>&1; do
  sleep 2
done

echo "Waiting for MongoDB to become healthy..."
until docker compose exec -T mongo mongosh --quiet -u root -p root --authenticationDatabase admin --eval 'db.adminCommand({ ping: 1 }).ok' | grep -q 1; do
  sleep 2
done

echo "Running MySQL tests..."
docker compose exec -T mysql mysql -uroot -proot indexing_lab < mysql/tests/all_tests.sql | tee mysql_result.txt

echo "Running MongoDB tests..."
docker compose exec -T mongo mongosh --quiet -u root -p root --authenticationDatabase admin /tests/all_tests.js | tee mongo_result.txt

echo "Done. Results saved to mysql_result.txt and mongo_result.txt"
