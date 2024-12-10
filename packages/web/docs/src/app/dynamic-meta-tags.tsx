'use client';

import { useConfig } from '@theguild/components';

const siteDescription =
  'Fully Open-source schema registry, analytics and gateway for GraphQL federation and other GraphQL APIs';
const siteName = 'Hive';

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

  // Get the current page path
  // Because it shows the full path, from top to bottom,
  // we need to get the last one to get the current page.
  const pagePath = normalizePagesResult.activePath[normalizePagesResult.activePath.length - 1];

  const isGatewayDocsPage = pagePath.route.includes('/docs/gateway');
  const suffix = isGatewayDocsPage ? 'Hive Gateway' : 'Hive';
  const title = `${pagePath.title} - ${suffix}`;

  const {
    description = `${siteName}: ${siteDescription}`,
    canonical,
    ogImage,
  } = pagePath.frontMatter;

  const canonicalUrl = ensureAbsolute(canonical ?? pagePath.route);

  return (
    <>
      <link rel="canonical" href={canonicalUrl} />
      <meta content="en" httpEquiv="Content-Language" />
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:locale" content="en_US" />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:image" content={ensureAbsolute(ogImage ?? '/og-image.png')} />
      <meta property="og:image:alt" content={description} />
      <meta property="og:image:width" content="1340" />
      <meta property="og:image:height" content="700" />
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
