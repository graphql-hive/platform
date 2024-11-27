'use client';

import EcosystemPageContent from './content.mdx';
import { components } from './index';

const ecosystemPageNav = {
  ...Object.fromEntries(Object.keys(components).map(key => [key, () => null])),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <a
      href={`#${props.id}`}
      className="hive-focus focus-visible:text-green-1000 hover:text-green-1000 overflow-visible text-nowrap rounded-2xl px-4 py-5 font-medium text-green-800 transition hover:bg-white/10 focus:z-10 focus-visible:bg-white/10 focus-visible:ring-inset"
      onKeyDown={event => {
        if (event.key === 'ArrowLeft') {
          const previousElement = event.currentTarget.previousElementSibling;
          if (previousElement) {
            (previousElement as HTMLElement).focus();
          }
        } else if (event.key === 'ArrowRight') {
          const nextElement = event.currentTarget.nextElementSibling;
          if (nextElement) {
            (nextElement as HTMLElement).focus();
          }
        }
      }}
    >
      {props.children}
    </a>
  ),
};

export function EcosystemPageNav() {
  return (
    <nav className="absolute top-full grid -translate-y-1/2 grid-flow-col rounded-2xl bg-blue-400 [grid-auto-columns:1fr]">
      <EcosystemPageContent components={ecosystemPageNav} />
    </nav>
  );
}
