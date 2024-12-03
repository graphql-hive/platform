/* eslint-disable import/no-extraneous-dependencies */
import { ReactNode } from 'react';
import localFont from 'next/font/local';
import { Layout, useConfig } from 'nextra-theme-docs';
import { Head } from 'nextra/components';
import { getPageMap } from 'nextra/page-map';
import '@theguild/components/style.css';
import '../components/navigation-menu/navbar-global-styles.css';
import '../selection-styles.css';
import { PRODUCTS } from '@theguild/components';
import { getDefaultMetadata } from '@theguild/components/server';
import { Footer } from '../components/footer';
import { NavigationMenu } from '../components/navigation-menu';

export default function RootLayout({ children }: { children: ReactNode }) {
  return <HiveLayout>{children}</HiveLayout>;
}

export const metadata = getDefaultMetadata({
  productName: PRODUCTS.HIVE.name,
  websiteName: 'Hive',
  description:
    'Fully Open-source schema registry, analytics and gateway for GraphQL federation and other GraphQL APIs',
});

const neueMontreal = localFont({
  src: [
    { path: '../fonts/PPNeueMontreal-Regular.woff2', weight: '400' },
    { path: '../fonts/PPNeueMontreal-Medium.woff2', weight: '500' },
    { path: '../fonts/PPNeueMontreal-Medium.woff2', weight: '600' },
  ],
});

/**
 * Alternative to `GuildLayout` for Hive and Hive Gateway websites.
 */
const HiveLayout = async ({ children }: { children: ReactNode }) => {
  const [meta, ...pageMap] = await getPageMap();

  const productsPage = pageMap.find(p => 'name' in p && p.name === 'products')!;
  // @ts-expect-error -- this should be fixed in Nextra, without route, the collapsible doesn't work
  productsPage.route = '#';

  return (
    <html
      lang="en"
      // Required to be set for `nextra-theme-docs` styles
      dir="ltr"
      // Suggested by `next-themes` package https://github.com/pacocoursey/next-themes#with-app
      suppressHydrationWarning
      className="font-sans"
    >
      <Head>
        <style>{
          /* css */ `
          :root {
            --font-sans: ${neueMontreal.style.fontFamily};
          }
          body {
            --nextra-primary-hue: 67.1deg;
            --nextra-primary-saturation: 100%;
            --nextra-primary-lightness: 55%;
            --nextra-bg: 17, 17, 17;
          }
          body.light, .light body {
            --nextra-primary-hue: 191deg;
            --nextra-primary-saturation: 40%;
            --nextra-bg: 255, 255, 255;
          }
          ._tracking-tight,
          .nextra-steps :is(h2, h3, h4) {
            letter-spacing: normal;
          }
        `
        }</style>
        <MetaTags />
      </Head>
      <body>
        <Layout
          editLink="Edit this page on GitHub"
          docsRepositoryBase="https://github.com/graphql-hive/platform/tree/main/packages/web/docs"
          pageMap={[
            {
              data: {
                // @ts-expect-error -- fixme (copied from Dima's v8 PR (sorry))
                ...meta.data,
              },
            },
            ...pageMap,
          ]}
          feedback={{
            labels: 'kind/docs',
          }}
          navbar={<NavigationMenu />}
          sidebar={{
            defaultMenuCollapseLevel: 1,
          }}
          footer={<Footer />}
        >
          {children}
        </Layout>
      </body>
    </html>
  );
};

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

function MetaTags() {
  const { frontMatter, title: pageTitle, normalizePagesResult } = useConfig();

  // Get the current page path
  // Because it shows the full path, from top to bottom,
  // we need to get the last one to get the current page.
  const pagePath = normalizePagesResult.activePath[normalizePagesResult.activePath.length - 1];

  const isGatewayDocsPage = pagePath.route.includes('/docs/gateway');
  const suffix = isGatewayDocsPage ? 'Hive Gateway' : 'Hive';
  const title = `${pageTitle} - ${suffix}`;
  const { description = `${siteName}: ${siteDescription}`, canonical, ogImage } = frontMatter;

  const canonicalUrl = ensureAbsolute(canonical ?? pagePath.route);

  return (
    <>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
      <link rel="canonical" href={canonicalUrl} />
      <meta content="en" httpEquiv="Content-Language" />
      <title>{title}</title>
      <meta name="robots" content="index,follow" />
      <meta name="description" content={description} />
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:site" content="@TheGuildDev" />
      <meta name="twitter:creator" content="@TheGuildDev" />
      {/* OG */}
      <meta property="og:site_name" content="Hive" />
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:locale" content="en_US" />
      <meta property="og:description" content={description} />
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
