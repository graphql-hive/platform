/* eslint-disable import/no-extraneous-dependencies */
import { Anchor } from 'nextra/components';
import { cn } from '@theguild/components';
import { useMDXComponents as getDocsMDXComponents } from '@theguild/components/server';

export const Link: typeof Anchor = ({ className, ...props }) => {
  return (
    <Anchor
      // we remove `text-underline-position` from default mextra-theme-docs link styles
      className={cn(
        'hive-focus -mx-1 -my-0.5 rounded px-1 py-0.5 text-blue-700 underline hover:no-underline focus-visible:ring-current focus-visible:ring-offset-blue-200 dark:text-blue-500 dark:focus-visible:ring-offset-blue-800',
        className,
      )}
      {...props}
    />
  );
};
export const docsMDXComponents = {
  a: Link,
};

export const useMDXComponents = () => {
  return getDocsMDXComponents(docsMDXComponents);
};
