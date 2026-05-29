import { describe, it, expect } from 'vitest';
import { MigrationRegistry } from '../../../src/migrations/registry.js';
import type { Migration } from '../../../src/migrations/types.js';

function makeMigration(version: string, opts?: { upError?: Error; downError?: Error }): Migration {
  const calls: string[] = [];
  return {
    version,
    description: `Migration ${version}`,
    async up() {
      if (opts?.upError) throw opts.upError;
      calls.push('up');
    },
    async down() {
      if (opts?.downError) throw opts.downError;
      calls.push('down');
    },
    // expose calls for testing via cast
    ...({ _calls: calls } as any),
  } as Migration & { _calls: string[] };
}

describe('MigrationRegistry', () => {
  it('registers and lists migrations', () => {
    const registry = new MigrationRegistry();
    const m1 = makeMigration('001');
    const m2 = makeMigration('002');
    registry.register(m1);
    registry.register(m2);
    expect(registry.list()).toEqual([m1, m2]);
  });

  it('runAll calls up() on each migration in order', async () => {
    const registry = new MigrationRegistry();
    const order: string[] = [];
    const m1: Migration = { version: '001', description: 'first', async up() { order.push('001'); }, async down() {} };
    const m2: Migration = { version: '002', description: 'second', async up() { order.push('002'); }, async down() {} };
    registry.register(m1);
    registry.register(m2);
    await registry.runAll();
    expect(order).toEqual(['001', '002']);
  });

  it('rollback calls down() on each migration in reverse order', async () => {
    const registry = new MigrationRegistry();
    const order: string[] = [];
    const m1: Migration = { version: '001', description: 'first', async up() {}, async down() { order.push('001'); } };
    const m2: Migration = { version: '002', description: 'second', async up() {}, async down() { order.push('002'); } };
    registry.register(m1);
    registry.register(m2);
    await registry.rollback();
    expect(order).toEqual(['002', '001']);
  });

  it('list returns a copy', () => {
    const registry = new MigrationRegistry();
    const m1 = makeMigration('001');
    registry.register(m1);
    const list = registry.list();
    list.push(makeMigration('999'));
    expect(registry.list()).toHaveLength(1);
  });
});
