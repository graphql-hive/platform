/* eslint-disable import/no-extraneous-dependencies */
import { generateStaticParamsFor, importPage } from 'nextra/pages';
import { PageProps } from '../../../../.next/types/app/layout.js';
import { useMDXComponents } from '../../../../mdx-components.js';

export const generateStaticParams = generateStaticParamsFor('mdxPath');

export async function generateMetadata(props: PageProps) {
  const params = await props.params;
  const { metadata } = await importPage(params.mdxPath);
  return metadata;
}

const Wrapper = useMDXComponents({}).wrapper;

export default async function Page(props: PageProps) {
  const params = await props.params;
  const result = await importPage(params.mdxPath);
  const { default: MDXContent, toc, metadata } = result;

  console.log('docs page', { props, toc, metadata });

  return (
    <Wrapper toc={toc} metadata={metadata}>
      <MDXContent {...props} params={params} />
    </Wrapper>
  );
}
