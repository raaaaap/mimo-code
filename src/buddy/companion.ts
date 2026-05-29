import type { Companion, CompanionBones, StoredCompanion } from './types.js';
import { xiaomi_cat } from './types.js';

const XIAOMI_CAT_BONES: CompanionBones = {
  species: xiaomi_cat,
};

let cachedCompanion: Companion | undefined;
let cachedKey: string | undefined;

export function resolveCompanion(
  stored: StoredCompanion | undefined,
  muted: boolean,
): Companion | undefined {
  if (!stored || muted) return undefined;
  return { ...XIAOMI_CAT_BONES, ...stored };
}

export function getCompanion(): Companion | undefined {
  return cachedCompanion;
}

export function setCompanionCache(key: string, companion: Companion | undefined): void {
  cachedKey = key;
  cachedCompanion = companion;
}

export function getCachedKey(): string | undefined {
  return cachedKey;
}

export function roll(): { bones: CompanionBones } {
  return { bones: XIAOMI_CAT_BONES };
}
