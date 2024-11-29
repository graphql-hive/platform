// eslint-disable-next-line import/no-extraneous-dependencies
import { Anchor } from 'nextra/components';
import { cn } from '@theguild/components';
import { useMDXComponents as getDocsMDXComponents } from '@theguild/components/server';

/**
 * @type {import('nextra/components').Anchor}
 */
export const Link: typeof Anchor = ({ className, ...props }) => {
  return (
    <Anchor
      // we remove `text-underline-position` from default Nextra link styles
      className={cn('text-blue-700 underline hover:no-underline dark:text-blue-500', className)}
      {...props}
    />
  );
};
export const docsMDXComponents = {
  a: Link,
};
