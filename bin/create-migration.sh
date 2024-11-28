#!/bin/bash
set -e

# Default environment
ENV="development"

# Parse command line arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --env|-e)
      ENV="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# Validate environment
if [ ! -f ".env.${ENV}" ]; then
    echo "Error: Environment file .env.${ENV} not found"
    exit 1
fi

# Run the prisma migrate dev command to generate up migration and capture its output
output=$(dotenv -e .env.${ENV} -- npx prisma migrate dev --create-only 2>&1 | tee /dev/tty)

migration_name=$(echo "$output" | sed -n 's/.*following migration without applying it \(.*\)/\1/p')

if [ -z "$migration_name" ]; then
    echo "Failed to extract migration name from the output."
    echo "Prisma output was: $output"
    exit 1
fi

migration_dir="prisma/migrations/$migration_name"

if [ ! -d "$migration_dir" ]; then
    echo "Migration directory not found: $migration_dir"
    exit 1
fi

# Generate the down migration SQL and save it in the migration directory
dotenv -e .env.${ENV} -- npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma --script > "$migration_dir/down.sql"

echo "Up and down migrations created successfully in $migration_dir"