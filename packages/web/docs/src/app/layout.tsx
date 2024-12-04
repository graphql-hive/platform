/* eslint-disable import/no-extraneous-dependencies */
import { ReactNode } from 'react';
import localFont from 'next/font/local';
import { Layout } from 'nextra-theme-docs';
import { Head } from 'nextra/components';
import '@theguild/components/style.css';
import '../components/navigation-menu/navbar-global-styles.css';
import '../selection-styles.css';
import { PRODUCTS } from '@theguild/components';
import { getDefaultMetadata, getPageMap } from '@theguild/components/server';
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
 * TODO: Move this to `@theguild/components`
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
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover" />
        <meta content="en" httpEquiv="Content-Language" />
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
