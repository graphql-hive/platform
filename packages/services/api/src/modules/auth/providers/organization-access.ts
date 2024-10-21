import DataLoader from 'dataloader';
import { forwardRef, Inject, Injectable, Scope } from 'graphql-modules';
import { Token } from '../../../shared/entities';
import { AccessError } from '../../../shared/errors';
import { Logger } from '../../shared/providers/logger';
import { Storage } from '../../shared/providers/storage';
import { TokenSelector, TokenStorage } from '../../token/providers/token-storage';
import type { ProjectAccessScope } from './project-access';
import { OrganizationAccessScope } from './scopes';
import type { TargetAccessScope } from './target-access';

export { OrganizationAccessScope } from './scopes';

export interface OrganizationOwnershipSelector {
  userId: string;
  organizationId: string;
}

export interface OrganizationUserScopesSelector {
  userId: string;
  organizationId: string;
}

export interface OrganizationUserAccessSelector {
  userId: string;
  organizationId: string;
  scope: OrganizationAccessScope;
}

interface OrganizationTokenAccessSelector {
  token: string;
  organizationId: string;
  scope: OrganizationAccessScope;
}

const organizationAccessScopeValues = Object.values(OrganizationAccessScope);

export function isOrganizationScope(scope: any): scope is OrganizationAccessScope {
  return organizationAccessScopeValues.includes(scope);
}

@Injectable({
  scope: Scope.Operation,
})
export class OrganizationAccess {
  private logger: Logger;
  private userAccess: DataLoader<OrganizationUserAccessSelector, boolean, string>;
  private tokenAccess: DataLoader<OrganizationTokenAccessSelector, boolean, string>;
  private allScopes: DataLoader<
    OrganizationUserScopesSelector,
    ReadonlyArray<OrganizationAccessScope | ProjectAccessScope | TargetAccessScope>,
    string
  >;
  private scopes: DataLoader<
    OrganizationUserScopesSelector,
    readonly OrganizationAccessScope[],
    string
  >;
  tokenInfo: DataLoader<TokenSelector, Token | null, string>;
  ownership: DataLoader<
    {
      organizationId: string;
    },
    string | null,
    string
  >;

  constructor(
    logger: Logger,
    private storage: Storage,
    @Inject(forwardRef(() => TokenStorage)) private tokenStorage: TokenStorage,
  ) {
    this.logger = logger.child({
      source: 'OrganizationAccess',
    });
    this.userAccess = new DataLoader(
      async selectors => {
        const scopes = await this.scopes.loadMany(selectors);

        return selectors.map((selector, i) => {
          const scopesForSelector = scopes[i];

          if (scopesForSelector instanceof Error) {
            this.logger.warn(
              `OrganizationAccess:user (error=%s, selector=%o)`,
              scopesForSelector.message,
              selector,
            );
            return false;
          }

          return scopesForSelector.includes(selector.scope);
        });
      },
      {
        cacheKeyFn(selector) {
          return JSON.stringify({
            type: 'OrganizationAccess:user',
            organization: selector.organizationId,
            user: selector.userId,
            scope: selector.scope,
          });
        },
      },
    );
    this.tokenAccess = new DataLoader(
      selectors =>
        Promise.all(
          selectors.map(async selector => {
            const tokenInfo = await this.tokenInfo.load(selector);

            if (tokenInfo?.organization === selector.organizationId) {
              return tokenInfo.scopes.includes(selector.scope);
            }

            return false;
          }),
        ),
      {
        cacheKeyFn(selector) {
          return JSON.stringify({
            type: 'OrganizationAccess:token',
            organization: selector.organizationId,
            token: selector.token,
            scope: selector.scope,
          });
        },
      },
    );
    this.allScopes = new DataLoader(
      async selectors => {
        const scopesPerSelector = await this.storage.getOrganizationMemberAccessPairs(selectors);

        return selectors.map((_, i) => scopesPerSelector[i]);
      },
      {
        cacheKeyFn(selector) {
          return JSON.stringify({
            type: 'OrganizationAccess:allScopes',
            organization: selector.organizationId,
            user: selector.userId,
          });
        },
      },
    );
    this.scopes = new DataLoader(
      async selectors => {
        const scopesPerSelector = await this.allScopes.loadMany(selectors);

        return selectors.map((selector, i) => {
          const scopes = scopesPerSelector[i];

          if (scopes instanceof Error) {
            this.logger.warn(
              `OrganizationAccess:scopes (error=%s, selector=%o)`,
              scopes.message,
              selector,
            );
            return [];
          }

          return scopes.filter(isOrganizationScope);
        });
      },
      {
        cacheKeyFn(selector) {
          return JSON.stringify({
            type: 'OrganizationAccess:scopes',
            organization: selector.organizationId,
            user: selector.userId,
          });
        },
      },
    );

    this.ownership = new DataLoader(
      async selectors => {
        const ownerPerSelector = await Promise.all(
          selectors.map(selector => this.storage.getOrganizationOwnerId(selector)),
        );

        return selectors.map((_, i) => ownerPerSelector[i]);
      },
      {
        cacheKeyFn(selector) {
          return JSON.stringify({
            type: 'OrganizationAccess:ownership',
            organization: selector.organizationId,
          });
        },
      },
    );

    this.tokenInfo = new DataLoader(
      selectors => Promise.all(selectors.map(selector => this.tokenStorage.getToken(selector))),
      {
        cacheKeyFn(selector) {
          return selector.token;
        },
      },
    );
  }

  async ensureAccessForToken(selector: OrganizationTokenAccessSelector): Promise<void | never> {
    const canAccess = await this.tokenAccess.load(selector);

    if (!canAccess) {
      throw new AccessError(`Missing ${selector.scope} permission`);
    }
  }

  async ensureAccessForUser(selector: OrganizationUserAccessSelector): Promise<void | never> {
    const canAccess = await this.userAccess.load(selector);

    if (!canAccess) {
      throw new AccessError(`Missing ${selector.scope} permission`);
    }
  }

  async checkAccessForUser(selector: OrganizationUserAccessSelector): Promise<boolean> {
    return this.userAccess.load(selector);
  }

  async checkOwnershipForUser(selector: OrganizationOwnershipSelector) {
    const owner = await this.ownership.load(selector);

    if (!owner) {
      return false;
    }

    return owner === selector.userId;
  }

  async getMemberScopes(selector: OrganizationUserScopesSelector) {
    return this.scopes.load(selector);
  }

  async getAllScopes(selectors: readonly OrganizationUserScopesSelector[]) {
    return this.allScopes.loadMany(selectors);
  }

  resetAccessCache() {
    this.userAccess.clearAll();
    this.tokenAccess.clearAll();
    this.allScopes.clearAll();
    this.scopes.clearAll();
    this.tokenInfo.clearAll();
  }
}
