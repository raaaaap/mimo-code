export type { Skill } from './types.js';
export { loadSkillsFromDir } from './loader.js';
export { createRememberSkill } from './builtin/remember.js';
export { createSimplifySkill } from './builtin/simplify.js';
export { createBatchSkill } from './builtin/batch.js';
export { createLoopSkill } from './builtin/loop.js';
export { createVerifySkill } from './builtin/verify.js';
export { createDebugSkill } from './builtin/debug.js';
export { createReviewSkill } from './builtin/review.js';
export { createTestSkill } from './builtin/test.js';
export { createDocumentSkill } from './builtin/document.js';
export { createRefactorSkill } from './builtin/refactor.js';

import type { Skill } from './types.js';
import { createRememberSkill } from './builtin/remember.js';
import { createSimplifySkill } from './builtin/simplify.js';
import { createBatchSkill } from './builtin/batch.js';
import { createLoopSkill } from './builtin/loop.js';
import { createVerifySkill } from './builtin/verify.js';
import { createDebugSkill } from './builtin/debug.js';
import { createReviewSkill } from './builtin/review.js';
import { createTestSkill } from './builtin/test.js';
import { createDocumentSkill } from './builtin/document.js';
import { createRefactorSkill } from './builtin/refactor.js';

const builtinSkills: Skill[] = [
  createRememberSkill(),
  createSimplifySkill(),
  createBatchSkill(),
  createLoopSkill(),
  createVerifySkill(),
  createDebugSkill(),
  createReviewSkill(),
  createTestSkill(),
  createDocumentSkill(),
  createRefactorSkill(),
];

export function getSkill(name: string): Skill | undefined {
  return builtinSkills.find(s => s.name === name || s.aliases?.includes(name));
}

export function listSkills(): Skill[] {
  return builtinSkills;
}
