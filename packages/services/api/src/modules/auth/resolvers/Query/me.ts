import { Session } from '../../lib/authz';
import type { QueryResolvers } from './../../../../__generated__/types.next';

export const me: NonNullable<QueryResolvers['me']> = (_, __, { injector }) => {
  // @ts-expect-error AbstractType<T> is missing here.
  return injector.get(Session).getViewer();
};
