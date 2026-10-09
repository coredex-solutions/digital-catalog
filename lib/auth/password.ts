import bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}


/** A one-time password the owner passes on to a new team member (shown once, never stored) */
export function temporaryPassword(): string {
  // 12 URL-safe characters (~72 bits)
  return randomBytes(9).toString('base64url');
}
