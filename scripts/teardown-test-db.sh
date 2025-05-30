#!/bin/bash

set -e

echo "🧹 Cleaning up test database..."

# Stop and remove test containers
echo "🐳 Stopping test containers..."
docker-compose -f docker-compose.test.yml down -v --remove-orphans

echo "✅ Test database cleanup completed!"