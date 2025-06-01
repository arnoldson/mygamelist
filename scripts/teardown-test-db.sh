#!/bin/bash

set -e

COMPOSE_FILE="docker-compose.test.yml"
PROJECT_NAME="mygamelist_test"

echo "🧹 Cleaning up test database..."

# Stop and remove test containers
echo "🐳 Stopping test containers..."
docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME down -v --remove-orphans

echo "✅ Test database cleanup completed!"