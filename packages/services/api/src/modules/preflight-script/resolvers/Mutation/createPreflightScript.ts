import { MutationResolvers } from '../../../../__generated__/types.next';
import { PreflightScriptProvider } from '../../providers/preflight-script.provider';

export const createPreflightScript: NonNullable<
  MutationResolvers['createPreflightScript']
> = async (_parent, { selector, input }, { injector }) => {
  const { preflightScript, target } = await injector
    .get(PreflightScriptProvider)
    .createPreflightScript(selector, input);

  return {
    ok: {
      __typename: 'PreflightScriptOkPayload',
      preflightScript,
      updatedTarget: target,
    },
  };
};
