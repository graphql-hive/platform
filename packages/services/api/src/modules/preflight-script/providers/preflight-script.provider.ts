import { Injectable, Scope } from 'graphql-modules';
import { TargetSelectorInput } from '../../../__generated__/types.next';
import { Target } from '../../../shared/entities';
import { Session } from '../../auth/lib/authz';
import { IdTranslator } from '../../shared/providers/id-translator';
import { Logger } from '../../shared/providers/logger';
import { Storage } from '../../shared/providers/storage';
import type { PreflightScriptModule } from './../__generated__/types';

@Injectable({
  global: true,
  scope: Scope.Operation,
})
export class PreflightScriptProvider {
  private logger: Logger;

  constructor(
    logger: Logger,
    private storage: Storage,
    private session: Session,
    private idTranslator: IdTranslator,
  ) {
    this.logger = logger.child({ source: 'PreflightScriptProvider' });
  }

  getPreflightScript(targetSlug: string) {
    return this.storage.getPreflightScript({ targetSlug });
  }

  async createPreflightScript(
    selector: TargetSelectorInput,
    { sourceCode }: PreflightScriptModule.CreatePreflightScriptInput,
  ): Promise<{
    preflightScript: PreflightScriptModule.PreflightScript;
    target: Target;
  }> {
    const [organizationId, projectId, targetId] = await Promise.all([
      this.idTranslator.translateOrganizationId(selector),
      this.idTranslator.translateProjectId(selector),
      this.idTranslator.translateTargetId(selector),
    ]);

    await this.session.assertPerformAction({
      action: 'laboratory:createPreflightScript',
      organizationId,
      params: {
        organizationId,
        projectId,
        targetId,
      },
    });

    const target = await this.storage.getTarget({
      organizationId,
      projectId,
      targetId,
    });

    const currentUser = await this.session.getViewer();

    const preflightScript = await this.storage.createPreflightScript({
      createdByUserId: currentUser.id,
      sourceCode,
      targetId,
    });

    return {
      preflightScript,
      target
    }
  }

  async updatePreflightScript(
    selector: TargetSelectorInput,
    input: PreflightScriptModule.UpdatePreflightScriptInput,
  ): Promise<{
    preflightScript: PreflightScriptModule.PreflightScript | null;
    target: Target;
  }> {
    const [organizationId, projectId, targetId] = await Promise.all([
      this.idTranslator.translateOrganizationId(selector),
      this.idTranslator.translateProjectId(selector),
      this.idTranslator.translateTargetId(selector),
    ]);

    await this.session.assertPerformAction({
      action: 'laboratory:updatePreflightScript',
      organizationId,
      params: {
        organizationId,
        projectId,
        targetId,
      },
    });

    const target = await this.storage.getTarget({
      organizationId,
      projectId,
      targetId,
    });

    const preflightScript = await this.storage.updatePreflightScript({
      id: input.id,
      sourceCode: input.sourceCode,
    });

    return {
      preflightScript,
      target,
    };
  }
}
