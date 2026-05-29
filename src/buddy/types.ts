export const xiaomi_cat = 'xiaomi_cat' as const;
export type Species = typeof xiaomi_cat;

export type CompanionBones = {
  species: Species;
};

export type CompanionSoul = {
  name: string;
  personality: string;
};

export type Companion = CompanionBones &
  CompanionSoul & {
    hatchedAt: number;
  };

export type StoredCompanion = CompanionSoul & { hatchedAt: number };
