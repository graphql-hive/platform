import { z } from 'zod';
import Command from '../../base-command';

export default class ResetConfig extends Command<typeof ResetConfig> {
  static description = 'resets local cli configuration';

  async run() {
    this.userConfig.clear();
    const message = 'Config cleared.';
    this.logSuccess(message);
    return this.successData({
      message,
    });
  }
}
