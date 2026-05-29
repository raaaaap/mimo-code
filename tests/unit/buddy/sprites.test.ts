import { describe, it, expect } from 'vitest';
import { renderSprite, spriteFrameCount, renderFace } from '../../../src/buddy/sprites.js';

describe('sprites', () => {
  it('renderSprite returns 7 lines', () => {
    expect(renderSprite(0)).toHaveLength(7);
  });

  it('renderSprite wraps frame index', () => {
    const count = spriteFrameCount();
    expect(renderSprite(count)).toEqual(renderSprite(0));
  });

  it('spriteFrameCount returns 8', () => {
    expect(spriteFrameCount()).toBe(8);
  });

  it('renderFace returns cat face', () => {
    expect(renderFace()).toBe('(●ω●)');
  });
});
