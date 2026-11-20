// Mengelola penyimpanan lokal browser (localStorage) secara aman beserta pencatatan audit log.

import { INITIAL_SEED_STATE, STORAGE_KEY } from '../config';
import { AppState, AuditLog } from '../types';
import { getNowWIBTimestamp } from './format';

export function loadAppState(): AppState {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return structuredClone(INITIAL_SEED_STATE);
    }
    const parsed = JSON.parse(raw) as Partial<AppState>;
    if (!parsed || !Array.isArray(parsed.profiles) || !Array.isArray(parsed.activities)) {
      return structuredClone(INITIAL_SEED_STATE);
    }
    return {
      ...structuredClone(INITIAL_SEED_STATE),
      ...parsed,
    };
  } catch {
    return structuredClone(INITIAL_SEED_STATE);
  }
}

export function saveAppState(state: AppState): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Abaikan jika kuota penyimpanan browser penuh
  }
}

export function resetDemoState(): AppState {
  const fresh = structuredClone(INITIAL_SEED_STATE);
  saveAppState(fresh);
  return fresh;
}

export function createAuditEntry(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  metadata: Record<string, string | number | boolean | null> = {},
): AuditLog {
  return {
    id: `log-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId,
    metadata,
    created_at: getNowWIBTimestamp(),
  };
}
