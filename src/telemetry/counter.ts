export class TelemetryCounter {
  private counts = new Map<string, number>();

  increment(name: string, value = 1): void {
    this.counts.set(name, (this.counts.get(name) ?? 0) + value);
  }

  get(name: string): number { return this.counts.get(name) ?? 0; }

  getAll(): Record<string, number> { return Object.fromEntries(this.counts); }

  reset(): void { this.counts.clear(); }
}
