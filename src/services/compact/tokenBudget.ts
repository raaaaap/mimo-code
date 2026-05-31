export class TokenBudget {
  private target: number;
  private used: number = 0;

  constructor(target: number) {
    this.target = target;
  }

  consume(tokens: number): void {
    this.used += tokens;
  }

  remaining(): number {
    return Math.max(0, this.target - this.used);
  }

  isOverBudget(): boolean {
    return this.used > this.target;
  }

  usage(): number {
    return this.used / this.target;
  }
}
