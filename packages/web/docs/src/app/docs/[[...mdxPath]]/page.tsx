/* eslint-disable import/no-extraneous-dependencies */
import { generateStaticParamsFor, importPage } from 'nextra/pages';
import { useMDXComponents } from '../../../../mdx-components.js';
import { ConfiguredGiscus } from '../../../components/configured-giscus';

// export const generateStaticParams = generateStaticParamsFor('mdxPath');

export const generateStaticParams = async () => {
  const pages = await generateStaticParamsFor('mdxPath')();
  for (const page of pages) {
    page.mdxPath = page.mdxPath.slice(1);
  }
  return pages;
};

export async function generateMetadata(props: PageProps<'...mdxPath'>) {
  const params = await props.params;
  const { metadata } = await importPage(['docs', ...(params.mdxPath || [])]);
  return metadata;
}

const Wrapper = useMDXComponents({}).wrapper;

export default async function Page(props: PageProps<'...mdxPath'>) {
  const params = await props.params;

  const result = await importPage(['docs', ...(params.mdxPath || [])]);
  const { default: MDXContent, toc, metadata } = result;

  return (
    <Wrapper toc={toc} metadata={metadata}>
      <MDXContent params={params} />
      <ConfiguredGiscus />
    </Wrapper>
  );
}
