/* eslint-disable import/no-extraneous-dependencies */
import { generateStaticParamsFor, importPage } from 'nextra/pages';
import { useMDXComponents } from '../../../../mdx-components.js';
import { ConfiguredGiscus } from '../../../components/configured-giscus';

export const generateStaticParams = generateStaticParamsFor('mdxPath');

export async function generateMetadata(props: PageProps<'...mdxPath'>) {
  const { mdxPath } = await props.params;
  const { metadata } = await importPage(mdxPath);
  return {
    ...metadata,
    ...(mdxPath[0] === 'gateway' && {
      title: { absolute: `${metadata.title} | Hive Gateway` },
    }),
  };
}

const Wrapper = useMDXComponents().wrapper;

export default async function Page(props: PageProps<'...mdxPath'>) {
  const params = await props.params;
  const result = await importPage(params.mdxPath);
  const { default: MDXContent, toc, metadata } = result;
  return (
    <Wrapper toc={toc} metadata={metadata}>
      <MDXContent {...props} params={params} />
      <ConfiguredGiscus />
    </Wrapper>
  );
}
