import { useMDXComponents as getDocsMDXComponents } from '@theguild/components/server';
import { docsMDXComponents } from './src/components/docs-mdx-components';

// TODO: Overwrite `a` to fix text-underline-position: from-font in Safari.

export const useMDXComponents = () => {
  return getDocsMDXComponents(docsMDXComponents);
};
