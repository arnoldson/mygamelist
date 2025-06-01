#!/bin/bash
# scripts/setup-test-db.sh

set -e  # Exit on any error

echo "🧪 Setting up test database..."

# Configuration with defaults
COMPOSE_FILE="docker-compose.test.yml"
PROJECT_NAME="mygamelist_test"

MAX_RETRIES=${MAX_RETRIES:-30}
RETRY_INTERVAL=${RETRY_INTERVAL:-2}

# Check if we're in CI
IS_CI=${CI:-false}
if [ "$GITHUB_ACTIONS" = "true" ]; then
    IS_CI=true
fi

# Function to wait for database to be ready
wait_for_db() {
    echo "⏳ Waiting for database to be ready..."
    local retries=0
    
    while [ $retries -lt $MAX_RETRIES ]; do
        # Just check if postgres service is accepting connections (any database)
        if docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME exec -T postgres pg_isready > /dev/null 2>&1; then
            echo "✅ Database is ready!"
            return 0
        fi
        
        echo "Database not ready, waiting... ($((retries + 1))/$MAX_RETRIES)"
        sleep $RETRY_INTERVAL
        retries=$((retries + 1))
    done
    
    echo "❌ Database failed to become ready after $((MAX_RETRIES * RETRY_INTERVAL)) seconds"
    return 1
}

# Function to check if container is already running
is_container_running() {
    docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME ps postgres | grep -q "Up"
}

# Main setup logic
main() {
    # Skip Docker setup in CI if using external DB
    if [ "$IS_CI" != "true" ]; then
        echo "🐳 Starting test database container..."
        
        # Check if already running
        if is_container_running; then
            echo "📋 Test database container already running"
        else
            # Start the container
            docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME up -d postgres
            
            # Wait for it to be ready
            if ! wait_for_db; then
                echo "❌ Failed to start test database"
                docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME logs postgres
                exit 1
            fi
        fi
    else
        echo "🔄 Running in CI, skipping Docker setup"
    fi
    
    echo "🗃️ Setting up database schema..."
    
    # Reset and migrate database
    if command -v npx > /dev/null 2>&1; then
    
        echo "Pushing database schema..."
        DATABASE_URL='postgresql://postgres:postgres@localhost:5433/mygamelist_test' npx prisma db push

        echo "Generating Prisma client..."
        npx prisma generate

        echo "Seeding database..."
        DATABASE_URL='postgresql://postgres:postgres@localhost:5433/mygamelist_test' npx prisma db seed
        
        echo "✅ Database setup complete"
    else
        echo "❌ npx not found. Make sure Node.js is installed."
        exit 1
    fi
    
    echo "🎯 Test database setup completed successfully!"
}

# Cleanup function
cleanup() {
    local exit_code=$?
    if [ $exit_code -ne 0 ] && [ "$IS_CI" != "true" ]; then
        echo "🧹 Setup failed, showing logs..."
        docker-compose -f $COMPOSE_FILE -p $PROJECT_NAME logs postgres
    fi
    exit $exit_code
}

# Set trap for cleanup
trap cleanup EXIT

# Run main function
main "$@"