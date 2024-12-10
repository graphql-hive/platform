'use client';

import { usePathname } from 'next/navigation';
import { useConfig } from '@theguild/components';

function ensureAbsolute(url: string) {
  if (url.startsWith('/')) {
    return `https://the-guild.dev/graphql/hive${url.replace(/\/$/, '')}`;
  }

  return url;
}

type NormalizedResult = ReturnType<typeof useConfig>['normalizePagesResult'];

function createBreadcrumb(normalizedResult: NormalizedResult) {
  const activePaths = normalizedResult.activePath.slice();

  if (activePaths[0].route !== '/') {
    // Add the home page to all pages except the home page
    activePaths.unshift({
      route: '/',
      title: 'Hive',
      name: 'index',
      type: 'page',
      display: 'hidden',
      children: [],
      frontMatter: {},
    });
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: activePaths.map((path, index) => {
      return {
        '@type': 'ListItem',
        position: index + 1,
        name: path.route === '/' ? 'Hive' : path.title,
        item: ensureAbsolute(path.route),
      };
    }),
  };
}

export function DynamicMetaTags() {
  const { normalizePagesResult } = useConfig();
  const metadata = normalizePagesResult.activeMetadata!;
  const pathname = usePathname();

  const canonicalUrl = ensureAbsolute(metadata.canonical ?? pathname);

  return (
    <>
      <link rel="canonical" href={canonicalUrl} />
      <meta content="en" httpEquiv="Content-Language" />
      <meta property="og:locale" content="en_US" />
      <meta property="og:url" content={canonicalUrl} />
      <script
        type="application/ld+json"
        id="breadcrumb"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(createBreadcrumb(normalizePagesResult), null, 2),
        }}
      />
    </>
  );
}
