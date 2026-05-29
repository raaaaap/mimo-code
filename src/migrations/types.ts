export interface Migration {
  version: string;
  description: string;
  up(): Promise<void>;
  down(): Promise<void>;
}
