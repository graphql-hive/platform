import { Injectable, Scope } from 'graphql-modules';
import { AuthManager } from '../../auth/providers/auth-manager';
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
    private authManager: AuthManager,
  ) {
    this.logger = logger.child({ source: 'PreflightScriptProvider' });
  }

  getPreflightScript(targetSlug: string) {
    return this.storage.getPreflightScript({ targetSlug });
  }

  async createPreflightScript(
    targetSlug: string,
    { sourceCode }: PreflightScriptModule.CreatePreflightScriptInput,
  ) {
    const currentUser = await this.authManager.getCurrentUser();

    return this.storage.createPreflightScript({
      createdByUserId: currentUser.id,
      sourceCode,
      targetSlug,
    });
  }

  updatePreflightScript(input: PreflightScriptModule.UpdatePreflightScriptInput) {
    return this.storage.updatePreflightScript({
      id: input.id,
      sourceCode: input.sourceCode,
    });
  }
}
