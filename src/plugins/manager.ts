import { EventBus } from './events.js';

export interface Plugin {
  name: string;
  version: string;
  description: string;
  onLoad: (context: PluginContext) => Promise<void>;
  onUnload: () => Promise<void>;
  capabilities: string[];
}

export interface PluginContext {
  events: EventBus;
  registerCommand: (cmd: any) => void;
  registerTool: (tool: any) => void;
}

export class PluginManager {
  private plugins = new Map<string, Plugin>();
  private eventBus = new EventBus();

  async load(plugin: Plugin): Promise<void> {
    const context: PluginContext = { events: this.eventBus, registerCommand: () => {}, registerTool: () => {} };
    await plugin.onLoad(context);
    this.plugins.set(plugin.name, plugin);
  }

  async unload(name: string): Promise<void> {
    const plugin = this.plugins.get(name);
    if (plugin) { await plugin.onUnload(); this.plugins.delete(name); }
  }

  getPlugins(): Plugin[] { return Array.from(this.plugins.values()); }
  getEventBus(): EventBus { return this.eventBus; }

  async install(name: string, source: string): Promise<boolean> {
    // Stub - would download and install plugin
    console.log(`Installing plugin ${name} from ${source}...`);
    return true;
  }

  async uninstall(name: string): Promise<boolean> {
    // Stub - would remove plugin
    console.log(`Uninstalling plugin ${name}...`);
    return true;
  }

  async list(): Promise<Array<{ name: string; version: string; enabled: boolean }>> {
    // Stub - would list installed plugins
    return [];
  }

  async enable(name: string): Promise<boolean> {
    // Stub - would enable plugin
    return true;
  }

  async disable(name: string): Promise<boolean> {
    // Stub - would disable plugin
    return true;
  }
}
