import { Typebox } from '../helpers/typebox/__';

export const CriticalityLevel = Typebox.Enum({
  Breaking: 'Breaking',
  Dangerous: 'Dangerous',
  Safe: 'Safe',
});

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
