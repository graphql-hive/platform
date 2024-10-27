import { Helmet } from 'react-helmet-async';

const defaultDescription =
  'Open-source GraphQL platform for managing APIs with federation and stitching, preventing breaking changes, and optimizing performance. Self-host or deploy in the cloud for complete data control.';
const defaultSuffix = 'GraphQL Hive';

export function Meta({
  title,
  description = defaultDescription,
  suffix = defaultSuffix,
}: {
  title: string;
  description?: string;
  suffix?: string;
}) {
  const fullTitle = suffix ? `${title} | ${suffix}` : title;

  return (
    <Helmet>
      <title>{fullTitle}</title>
      <meta property="og:title" content={fullTitle} key="title" />
      <meta name="description" content={description} key="description" />
      <meta property="og:url" key="og:url" content="https://app.graphql-hive.com" />
      <meta property="og:type" key="og:type" content="website" />
      <meta
        property="og:image"
        key="og:image"
        content="https://og-image.the-guild.dev/?product=HIVE&title=Open%20GraphQL%20Platform&extra=Prevent breaking changes, monitor performance and manage your gateway (Federation, Stitching)"
      />
    </Helmet>
  );
}
