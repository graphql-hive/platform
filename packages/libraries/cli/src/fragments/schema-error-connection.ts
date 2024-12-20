import BaseCommand from '../base-command';
import { SchemaHive } from '../helpers/schema';
import { Tex } from '../helpers/tex/__';

export namespace SchemaErrorConnection {
  export function log(this: BaseCommand<any>, errors: SchemaHive.SchemaErrorConnection) {
    this.logFailure(`Detected ${errors.total} error${errors.total > 1 ? 's' : ''}`);
    this.log('');

    errors.nodes.forEach(error => {
      this.log(Tex.indent, Tex.colors.red('-'), Tex.bolderize(error.message));
    });
  }
  export const toSchemaOutput = (errors: SchemaHive.SchemaErrorConnection) => {
    return errors.nodes.map(error => {
      return {
        message: error.message,
      };
    });
  };
}
