'use client';

import { usePathname } from 'next/navigation';
import {
  GitHubIcon,
  GraphQLConfCard,
  HiveNavigation,
  PaperIcon,
  PencilIcon,
  PRODUCTS,
  RightCornerIcon,
  TargetIcon,
} from '@theguild/components';
import graphQLConfLocalImage from './graphql-conf-image.webp';

const developerMenu = [
  {
    href: '/docs',
    icon: PaperIcon,
    children: 'Documentation',
  },
  { href: 'https://status.graphql-hive.com/', icon: TargetIcon, children: 'Status' },
  {
    href: '/product-updates',
    icon: RightCornerIcon,
    children: 'Product Updates',
  },
  { href: '/blog', icon: PencilIcon, children: 'Blog' },
  {
    href: 'https://github.com/dotansimha/graphql-code-generator',
    icon: GitHubIcon,
    children: 'GitHub',
  },
];

export function NavigationMenu() {
  const route = usePathname();

  return (
    <HiveNavigation
      className={isLandingPage(route) ? 'light max-w-[1392px]' : 'max-w-[90rem]'}
      companyMenuChildren={<GraphQLConfCard image={graphQLConfLocalImage} />}
      productName={PRODUCTS.HIVE.name}
      developerMenu={developerMenu}
    />
  );
}

const landingLikePages = ['/', '/pricing', '/federation', '/oss-friends'];
export const isLandingPage = (route: string) => landingLikePages.includes(route);
