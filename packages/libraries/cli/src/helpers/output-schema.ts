import { Typebox } from './typebox/__';

// prettier-ignore
export type OutputSchema =
		| Envelope
		| Typebox.Union<[Envelope]>
		| Typebox.Union<[Envelope, Envelope]>
		| Typebox.Union<[Envelope, Envelope, Envelope]>
		| Typebox.Union<[Envelope, Envelope, Envelope, Envelope]>;
// ... as many as needed

type Envelope = typeof OutputSchema.Envelope;

export namespace OutputSchema {
  export const NonEmptyString = Typebox.String({ minLength: 1 });

  export const Envelope = Typebox.Object({
    ok: Typebox.Literal(true),
    message: Typebox.Optional(Typebox.String()),
    // warnings: z.array(z.string()),
  });

  export namespace Effect {
    export const Skipped = Envelope.extend({
      effect: Typebox.Literal('skipped'),
    });
    export const Executed = Envelope.extend({
      effect: Typebox.Literal('executed'),
    });
  }
  export namespace DataOutputMode {
    export const Stdout = Typebox.Object({
      outputMode: Typebox.Literal('stdout'),
      content: Typebox.String(),
    });
    export const File = Typebox.Object({
      outputMode: Typebox.Literal('file'),
      path: Typebox.String(),
    });
  }
}
