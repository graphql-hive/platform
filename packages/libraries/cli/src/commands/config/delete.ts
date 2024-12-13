import { OutputSchema } from 'src/helpers/outputSchema';
import { z } from 'zod';
import { Args } from '@oclif/core';
import Command from '../../base-command';

export default class DeleteConfig extends Command<typeof DeleteConfig> {
  static successDataSchema = OutputSchema.Envelope.extend({
    data: z.object({
      key: OutputSchema.NonEmptyString,
    }),
  });
  static description = 'delete a specific cli configuration key';
  static args = {
    // TODO Terms like "property" or "setting" are more clear.
    // "key" is overloaded with authN/authZ concepts.
    key: Args.string({
      name: 'key',
      required: true,
      description: 'config key',
    }),
  };

  async run() {
    const { args } = await this.parse(DeleteConfig);
    this._userConfig!.delete(args.key);
    const message = `Config key "${args.key}" was deleted`;
    this.success(this.bolderize(message));
    return this.successData({
      message,
      data: {
        key: args.key,
      },
    });
  }
}
