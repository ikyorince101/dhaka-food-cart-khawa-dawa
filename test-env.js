import dotenv from "dotenv";

console.log('Before dotenv.config():');
console.log('DATABASE_URL:', process.env.DATABASE_URL);

dotenv.config();

console.log('After dotenv.config():');
console.log('DATABASE_URL:', process.env.DATABASE_URL);

// Check if .env file exists
import fs from 'fs';
import path from 'path';

const envPath = path.join(process.cwd(), '.env');
console.log('Checking for .env file at:', envPath);
console.log('.env file exists:', fs.existsSync(envPath));

if (fs.existsSync(envPath)) {
  console.log('.env file contents:');
  console.log(fs.readFileSync(envPath, 'utf8'));
} 