import { MutationResolvers } from '../../../../__generated__/types.next';
import { PreflightScriptProvider } from '../../providers/preflight-script.provider';

export const updatePreflightScript: NonNullable<
  MutationResolvers['updatePreflightScript']
> = async (_parent, { selector, input }, { injector }) => {
  const { preflightScript, target } = await injector.get(PreflightScriptProvider).updatePreflightScript(selector, input);

  if (!preflightScript) {
    return {
      error: {
        __typename: 'PreflightScriptError',
        message: 'Failed to update preflight script',
      },
    };
  }

  return {
    ok: {
      __typename: 'PreflightScriptOkPayload',
      preflightScript,
      updatedTarget: target,
    },
  };
};
