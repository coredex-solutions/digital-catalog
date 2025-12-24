import jwt from 'jsonwebtoken';
import type { SuperAdminJWTPayload, CatalogAdminJWTPayload, JWTPayload } from '../db/types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

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
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifySuperAdminToken(token: string): SuperAdminJWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
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
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

export function verifyCatalogAdminToken(token: string): CatalogAdminJWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    if (decoded.type === 'catalog_admin') {
      return decoded as CatalogAdminJWTPayload;
    }
    return null;
  } catch {
    return null;
  }
}

// ============================================
// Generic Token Verification
// ============================================

export function verifyAnyToken(token: string): JWTPayload | LegacyJWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload | LegacyJWTPayload;
    return decoded;
  } catch {
    return null;
  }
}

// ============================================
// Legacy Functions (backward compatibility)
// ============================================

export function signToken(payload: LegacyJWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): LegacyJWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as LegacyJWTPayload;
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
