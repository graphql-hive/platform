import { z } from 'zod';

// prettier-ignore
export type OutputSchema =
		| Envelope
		| z.ZodUnion<[Envelope, Envelope]>
		| z.ZodUnion<[Envelope, Envelope, Envelope]>
		| z.ZodUnion<[Envelope, Envelope, Envelope, Envelope]>;
// ... as many as needed

type Envelope = typeof OutputSchema.Envelope;

export namespace OutputSchema {
  export const NonEmptyString = z.string().min(1);

  export const Envelope = z.object({
    ok: z.literal(true),
    message: z.string().optional(),
  });

  export namespace Effect {
    export const Skipped = Envelope.extend({
      effect: z.literal('skipped'),
    });
    export const Executed = Envelope.extend({
      effect: z.literal('executed'),
    });
  }
}
