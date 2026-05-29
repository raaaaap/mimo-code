import type { ReactNode } from 'react';

export interface CommandArgument {
  name: string;
  description: string;
  required?: boolean;
}

export interface CommandOption {
  name: string;
  short?: string;
  description: string;
  type: 'string' | 'boolean' | 'number';
  default?: unknown;
}

export interface CommandContext {
  model: string;
  verbose: boolean;
  debug: boolean;
}

export interface Command {
  name: string;
  aliases?: string[];
  description: string;
  isEnabled: () => boolean;
  isHidden?: boolean;
  arguments?: CommandArgument[];
  options?: CommandOption[];
  call(args: string, context: CommandContext): Promise<string | void>;
  render?(args: string, context: CommandContext): ReactNode;
}

export class CommandRegistry {
  private commands = new Map<string, Command>();

  register(command: Command): void {
    this.commands.set(command.name, command);
    if (command.aliases) {
      for (const alias of command.aliases) {
        this.commands.set(alias, command);
      }
    }
  }

  get(name: string): Command | undefined {
    return this.commands.get(name);
  }

  getAll(): Command[] {
    const seen = new Set<string>();
    const result: Command[] = [];
    for (const cmd of this.commands.values()) {
      if (!seen.has(cmd.name)) {
        seen.add(cmd.name);
        result.push(cmd);
      }
    }
    return result;
  }

  parse(input: string): { command: Command; args: string } | null {
    const trimmed = input.trim();
    if (!trimmed.startsWith('/')) return null;

    const spaceIndex = trimmed.indexOf(' ');
    const commandPart = spaceIndex === -1 ? trimmed.slice(1) : trimmed.slice(1, spaceIndex);
    const args = spaceIndex === -1 ? '' : trimmed.slice(spaceIndex + 1).trim();

    const command = this.commands.get(commandPart);
    if (!command) return null;

    return { command, args };
  }
}
