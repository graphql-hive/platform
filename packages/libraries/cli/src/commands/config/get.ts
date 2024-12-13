import { OutputSchema } from 'src/helpers/output-schema';
import { z } from 'zod';
import { Args } from '@oclif/core';
import Command from '../../base-command';
import { allowedKeys, ValidConfigurationKeys } from '../../helpers/config';

export default class GetConfig extends Command<typeof GetConfig> {
  static SuccessSchema = OutputSchema.Envelope.extend({
    data: z.object({
      value: z.string().nullable().optional(),
    }),
  });
  static description = 'prints specific cli configuration';
  static args = {
    key: Args.string({
      name: 'key',
      required: true,
      description: 'config key',
      options: allowedKeys,
    }),
  };

  async run() {
    const { args } = await this.parse(GetConfig);
    const configurationValue = this.userConfig.get(args.key as ValidConfigurationKeys);
    console.dir(configurationValue);
    return this.successData({
      data: {
        // todo: can configurationValue be a serialized non-scalar JSON value? If so, then we should parse it here so that
        // user doesn't get nested JSON arrays/objects in their output.
        value: configurationValue,
      },
    });
  }
}
