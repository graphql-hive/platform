/* eslint-disable import/no-extraneous-dependencies */
import { ReactNode } from 'react';
import { Heading, NextraMetadata } from 'nextra';
import { generateStaticParamsFor, importPage as nextraImportPage } from 'nextra/pages';

export function getContentCollection(dirname: string, segmentKey: string) {
  /**
   * If we use just `generateStaticParamsFor('mdxPath')` the links in sidebar are
   * relative to /docs, so they're one segment short.
   */
  const generateStaticParams = async () => {
    const pages = await generateStaticParamsFor(segmentKey)();
    const filtered = pages
      .map(page => {
        if (page[segmentKey] === dirname) {
          return { [segmentKey]: page[segmentKey].slice(1) };
        }

        return null;
      })
      .filter(Boolean);

    console.log(filtered);

    return filtered;
  };

  const importPage = (
    segments: string[],
  ): Promise<{
    toc: Heading[];
    children: ReactNode;
    metadata: NextraMetadata;
    default: React.ComponentType<any>;
  }> => {
    return nextraImportPage([segmentKey, ...(segments || [])]);
  };

  async function generateMetadata(props: PageProps<`...${string}`>) {
    const params = await props.params;
    const { metadata } = await importPage(params[segmentKey]);
    return metadata;
  }

  return { generateStaticParams, generateMetadata, importPage };
}
