import type { Migration } from './types.js';

export class MigrationRegistry {
  private migrations: Migration[] = [];

  register(migration: Migration): void {
    this.migrations.push(migration);
  }

  async runAll(): Promise<void> {
    for (const m of this.migrations) await m.up();
  }

  async rollback(): Promise<void> {
    for (const m of this.migrations.reverse()) await m.down();
  }

  list(): Migration[] {
    return [...this.migrations];
  }
}
