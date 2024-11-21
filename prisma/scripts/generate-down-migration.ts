import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

//Get arguments from command line
const args = process.argv.slice(2);
const getArgumentValue = (flag: string): string | undefined => {
  const index = args.indexOf(flag);
  return index !== -1 ? args[index + 1] : undefined;
};

//parse arguments
const migrationName = getArgumentValue('--name') || getArgumentValue('-n');
const env = getArgumentValue('--env') || getArgumentValue('-e') || 'dev';

// Generate timestamp
const timestamp = new Date()
  .toISOString()
  .replace(/[:.]/g, '')
  .replace('Z', '')
  .replaceAll('-', '.');

// Create migrations directory if it doesn't exist
const migrationsDir = path.join(__dirname, '../migrations/down');
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
}

// Generate migration file name
const fileName = migrationName
  ? `${timestamp}.${migrationName}.sql`
  : `${timestamp}.sql`;
const filePath = path.join(migrationsDir, fileName);

// Execute prisma migrate diff command
try {
  const output = execSync(
    `dotenv -e src/config/env/${env}.env -- npx prisma migrate diff --from-schema-datamodel prisma/schema.prisma --to-schema-datasource prisma/schema.prisma --script`,
    { encoding: 'utf8' },
  );

  // Write to file
  fs.writeFileSync(filePath, output);
  console.log(`Down migration generated: ${fileName}`);
} catch (error) {
  console.error('Error generating migration:', error);
  process.exit(1);
}
