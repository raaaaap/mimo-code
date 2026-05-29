import type { Command } from '../commands.js';

/**
 * Factory that creates the `/fast` command, which toggles between the
 * default model and a lighter "fast" model.
 *
 * @param getModel   - returns the currently active model id
 * @param setModel   - sets the active model id
 * @param defaultModel - the full-featured model id
 * @param fastModel    - the lightweight / fast model id
 */
export function createFastCommand(
  getModel: () => string,
  setModel: (model: string) => void,
  defaultModel: string,
  fastModel: string,
): Command {
  return {
    name: 'fast',
    aliases: ['speed'],
    description: 'Toggle fast mode (lightweight model)',
    isEnabled: () => true,
    call: async () => {
      const current = getModel();
      if (current === fastModel) {
        setModel(defaultModel);
        return `Switched to default model: ${defaultModel}`;
      }
      setModel(fastModel);
      return `Switched to fast model: ${fastModel}`;
    },
  };
}
