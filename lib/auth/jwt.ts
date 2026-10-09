import jwt from 'jsonwebtoken';
import type { SuperAdminJWTPayload, CatalogAdminJWTPayload, JWTPayload } from '../db/types';

// Read lazily so builds without the env var still succeed; fail loudly at sign/verify time
// instead of silently falling back to a guessable secret.
function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET is not set');
  }
  return secret;
}

// Legacy payload type (for backward compatibility during migration)
export interface LegacyJWTPayload {
  userId: string;
  username: string;
}

// ============================================
// Super Admin Auth
// ============================================

export function signSuperAdminToken(payload: Omit<SuperAdminJWTPayload, 'type'>): string {
  return jwt.sign(
    { ...payload, type: 'super_admin' } as SuperAdminJWTPayload,
    getJwtSecret(),
    { expiresIn: '7d' }
  );
}

export function verifySuperAdminToken(token: string): SuperAdminJWTPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as JWTPayload;
    if (decoded.type === 'super_admin') {
      return decoded as SuperAdminJWTPayload;
    }
    return null;
  } catch {
    return null;
  }
}

// ============================================
// Catalog Admin Auth
// ============================================

export function signCatalogAdminToken(payload: Omit<CatalogAdminJWTPayload, 'type'>): string {
  return jwt.sign(
    { ...payload, type: 'catalog_admin' } as CatalogAdminJWTPayload,
    getJwtSecret(),
    { expiresIn: '7d' }
  );
}

export function verifyCatalogAdminToken(token: string): CatalogAdminJWTPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as JWTPayload;
    if (decoded.type === 'catalog_admin') {
      return decoded as CatalogAdminJWTPayload;
    }
    return null;
  } catch {
    return null;
  }
}

// ============================================
// Email Verification (signup)
// ============================================

// Issued by /api/auth/verify-code and required by /api/auth/signup, proving the
// caller entered the code sent to this email address.
export function signEmailVerificationToken(email: string): string {
  return jwt.sign({ type: 'email_verification', email }, getJwtSecret(), { expiresIn: '30m' });
}

export function verifyEmailVerificationToken(token: string): string | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { type?: string; email?: string };
    if (decoded.type === 'email_verification' && typeof decoded.email === 'string') {
      return decoded.email;
    }
    return null;
  } catch {
    return null;
  }
}

// Lets an owner open the guest menu with unpublished changes (?preview=…). Short-lived and
// tied to one catalog; it grants no admin access.
export function signMenuPreviewToken(catalogId: string): string {
  return jwt.sign({ type: 'menu_preview', catalogId }, getJwtSecret(), { expiresIn: '30m' });
}

export function verifyMenuPreviewToken(token: string, catalogId: string): boolean {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as { type?: string; catalogId?: string };
    return decoded.type === 'menu_preview' && decoded.catalogId === catalogId;
  } catch {
    return false;
  }
}

// ============================================
// Generic Token Verification
// ============================================

export function verifyAnyToken(token: string): JWTPayload | LegacyJWTPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret()) as JWTPayload | LegacyJWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

// Type guard helpers
export function isSuperAdminPayload(payload: JWTPayload | LegacyJWTPayload): payload is SuperAdminJWTPayload {
  return 'type' in payload && payload.type === 'super_admin';
}

export function isCatalogAdminPayload(payload: JWTPayload | LegacyJWTPayload): payload is CatalogAdminJWTPayload {
  return 'type' in payload && payload.type === 'catalog_admin';
}
