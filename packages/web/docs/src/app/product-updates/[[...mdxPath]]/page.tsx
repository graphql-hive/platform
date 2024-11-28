/* eslint-disable import/no-extraneous-dependencies */
import { generateStaticParamsFor, importPage } from 'nextra/pages';
import { useMDXComponents } from '../../../../mdx-components.js';
import { ConfiguredGiscus } from '../../../components/configured-giscus';

export const generateStaticParams = async () => {
  const pages = await generateStaticParamsFor('mdxPath')();
  return pages
    .map(page =>
      page.mdxPath[0] === 'product-updates' ? { mdxPath: page.mdxPath.slice(1) } : null,
    )
    .filter(Boolean);
};

export async function generateMetadata(props: PageProps<'...mdxPath'>) {
  const params = await props.params;
  const { metadata } = await importPage(['product-updates', ...(params.mdxPath || [])]);
  return metadata;
}

const Wrapper = useMDXComponents({}).wrapper;

export default async function Page(props: PageProps<'...mdxPath'>) {
  const params = await props.params;

  const result = await importPage(['product-updates', ...(params.mdxPath || [])]);
  const { default: MDXContent, toc, metadata } = result;

  return (
    <Wrapper toc={toc} metadata={metadata}>
      <MDXContent params={params} />
      <ConfiguredGiscus />
    </Wrapper>
  );
}
