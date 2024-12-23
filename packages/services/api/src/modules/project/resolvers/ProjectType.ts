import { ProjectType as ProjectTypeEnum } from '../../../shared/entities';
import type { ProjectTypeResolvers } from './../../../__generated__/types';

export const ProjectType: ProjectTypeResolvers = {
  FEDERATION: ProjectTypeEnum.FEDERATION,
  STITCHING: ProjectTypeEnum.STITCHING,
  SINGLE: ProjectTypeEnum.SINGLE,
};
