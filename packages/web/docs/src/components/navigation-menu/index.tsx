'use client';

import { usePathname } from 'next/navigation';
import { GraphQLConfCard, HiveNavigation, PRODUCTS } from '@theguild/components';
import graphQLConfLocalImage from './graphql-conf-image.webp';

const HiveLogo = PRODUCTS.HIVE.logo;

export function NavigationMenu() {
  const route = usePathname() || '/';

  return (
    <HiveNavigation
      logo={<HiveLogo />}
      className={isLandingPage(route) ? 'light max-w-[1392px]' : 'max-w-[90rem]'}
      companyMenuChildren={<GraphQLConfCard image={graphQLConfLocalImage} />}
      productName={PRODUCTS.HIVE.name}
    />
  );
}

const landingLikePages = ['/', '/pricing', '/federation', '/oss-friends'];
export const isLandingPage = (route: string) => landingLikePages.includes(route);
