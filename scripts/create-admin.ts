// Script to create admin user
import 'dotenv/config';
import { getDb } from '../lib/db/client';
import { hashPassword } from '../lib/auth/password';
import { randomUUID } from 'crypto';

async function main() {
  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD || 'admin123';

  try {
    const passwordHash = await hashPassword(password);
    const id = randomUUID();

    await getDb().execute({
      sql: 'INSERT OR REPLACE INTO admin_users (id, username, password_hash) VALUES (?, ?, ?)',
      args: [id, username, passwordHash],
    });

    console.log(`Admin user created: ${username}`);
    console.log(`Password: ${password}`);
    console.log('Please change the password after first login!');
    process.exit(0);
  } catch (error) {
    console.error('Error creating admin user:', error);
    process.exit(1);
  }
}

main();

