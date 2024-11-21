#!/bin/bash
set -e

# Default environment
ENV="dev"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -e|--env)
            if [ -n "$2" ]; then
                ENV=$2
                shift 2
            else
                echo "Error: Argument for $1 is missing" >&2
                exit 1
            fi
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Validate environment file exists
ENV_FILE="src/config/env/${ENV}.env"
if [ ! -f "$ENV_FILE" ]; then
    echo "Error: Environment file $ENV_FILE not found"
    exit 1
fi

echo "Starting services with environment: ${ENV}"

# Step 1: Run docker-compose with environment file
echo "Starting Docker containers..."
docker-compose --env-file "$ENV_FILE" up -d

# Wait for database to be ready
echo "Waiting for database to be ready..."
sleep 10

# Step 2: Run Prisma migrations
echo "Running database migrations..."
dotenv -e "$ENV_FILE" npx prisma migrate deploy

echo "Setup completed successfully!"

echo "Running containers:"
docker-compose --env-file "$ENV_FILE" ps