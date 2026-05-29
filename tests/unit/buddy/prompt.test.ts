import { describe, it, expect } from 'vitest';
import { companionIntroText, getCompanionSystemPrompt } from '../../../src/buddy/prompt.js';

describe('buddy prompt', () => {
  it('generates intro text with companion name', () => {
    const text = companionIntroText('小米猫');
    expect(text).toContain('小米猫');
    expect(text).toContain('Xiaomi Cat');
  });

  it('mentions companion stays out of the way', () => {
    expect(companionIntroText('TestCat')).toContain('stay out of the way');
  });

  it('getCompanionSystemPrompt returns undefined for undefined companion', () => {
    expect(getCompanionSystemPrompt(undefined)).toBeUndefined();
  });

  it('getCompanionSystemPrompt returns text for valid companion', () => {
    const result = getCompanionSystemPrompt({
      species: 'xiaomi_cat',
      name: '猫猫',
      personality: 'playful',
      hatchedAt: Date.now(),
    });
    expect(result).toContain('猫猫');
  });
});
