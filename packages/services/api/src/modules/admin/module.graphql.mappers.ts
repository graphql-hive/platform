import type { Scalars } from '../../__generated__/types';
import type { AdminOrganizationStats } from '../../shared/entities';

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export type AdminQueryMapper = {};
export type AdminStatsMapper = {
  period: {
    from: Scalars['DateTime']['input'];
    to: Scalars['DateTime']['input'];
  };
  resolution: number;
};
export type AdminGeneralStatsMapper = AdminStatsMapper;
export type AdminOrganizationStatsMapper = AdminOrganizationStats;
