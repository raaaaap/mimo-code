import { describe, it, expect } from 'vitest';
import { EventBus } from '../../src/plugins/events.js';
import { PluginManager } from '../../src/plugins/manager.js';

describe('EventBus', () => {
  it('should emit and subscribe', () => {
    const bus = new EventBus();
    let received = '';
    bus.on('test', (data) => { received = data as string; });
    bus.emit('test', 'hello');
    expect(received).toBe('hello');
  });
  it('should unsubscribe', () => {
    const bus = new EventBus();
    let count = 0;
    const unsub = bus.on('test', () => { count++; });
    bus.emit('test'); unsub(); bus.emit('test');
    expect(count).toBe(1);
  });
});

describe('PluginManager', () => {
  it('should load and unload plugins', async () => {
    const manager = new PluginManager();
    let loaded = false;
    await manager.load({ name: 'test', version: '1.0.0', description: 'Test', onLoad: async () => { loaded = true; }, onUnload: async () => { loaded = false; }, capabilities: [] });
    expect(loaded).toBe(true);
    await manager.unload('test');
    expect(loaded).toBe(false);
  });
});
