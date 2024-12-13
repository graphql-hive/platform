import { OutputSchema } from 'src/helpers/outputSchema';
import { z } from 'zod';
import { Args } from '@oclif/core';
import Command from '../../base-command';
import { allowedKeys, ValidConfigurationKeys } from '../../helpers/config';

export default class SetConfig extends Command<typeof SetConfig> {
  static successDataSchema = OutputSchema.Envelope.extend({
    data: z.object({
      key: OutputSchema.NonEmptyString,
      value: OutputSchema.NonEmptyString,
    }),
  });
  static description = 'updates a specific cli configuration key';
  static args = {
    key: Args.string({
      name: 'key',
      required: true,
      description: 'config key',
      options: allowedKeys,
    }),
    value: Args.string({
      name: 'value',
      required: true,
      description: 'config value',
    }),
  };

  async run() {
    const { args } = await this.parse(SetConfig);
    this.userConfig.set(args.key as ValidConfigurationKeys, args.value);
    const message = `Config key "${args.key}" was set to "${args.value}"`;
    this.success(this.bolderize(message));
    return this.successData({
      message,
      data: {
        key: args.key,
        value: args.value,
      },
    });
  }
}
