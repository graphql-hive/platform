import { DecorationIsolation, Heading, ProductCard, PRODUCTS } from '@theguild/components';
import { FOUR_MAIN_PRODUCTS } from '@theguild/components/products';
import { cn } from '../../lib';
import { Page } from '../page';
import EcosystemPageContent from './content.mdx';

export function EcosystemPage({ children }: { children: React.ReactNode }) {
  return (
    <Page className="text-green-1000 light mx-auto max-w-[90rem] overflow-hidden [&>:not(header)]:px-4 lg:[&>:not(header)]:px-8 xl:[&>:not(header)]:px-[120px]">
      {children}
    </Page>
  );
}

export const components = {
  EcosystemHeader: (props: React.HTMLAttributes<HTMLDivElement>) => (
    <header
      className="relative isolate flex max-w-[90rem] flex-col items-center gap-6 overflow-visible rounded-3xl bg-blue-400 px-4 py-6 text-center sm:py-12 md:gap-8 lg:py-24 [&>h1]:max-w-[800px] [&>p]:max-w-[520px]"
      {...props}
    >
      <span className="font-medium">The Ecosystem</span>
      {props.children}
      <CrossDecoration />
      <EcosystemPageNav />
    </header>
  ),
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => <Heading as="h1" size="xl" {...props} />,
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <Heading as="h2" size="xs" className="mb-4 mt-24" {...props} />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="text-green-800" {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => {
    return <ul className="-m-4 mt-5 grid grid-cols-4 gap-5 overflow-auto p-4" {...props} />;
  },
  li: (props: React.LiHTMLAttributes<HTMLLIElement>) => {
    const productName = String(props.children).toUpperCase() as keyof typeof PRODUCTS;
    const product = PRODUCTS[productName];

    if (!product) return null;

    return <ProductCard as="li" product={product} {...props} />;
  },
};

function CrossDecoration() {
  return (
    <DecorationIsolation className="-z-10 *:absolute">
      <ArchDecoration className="-left-10" />
      <ArchDecoration className="-right-10 scale-x-[-1]" />
      <ArchDecoration className="-right-10 bottom-0 rotate-180" />
      <ArchDecoration className="-left-10 bottom-0 scale-y-[-1]" />
    </DecorationIsolation>
  );
}

function ArchDecoration({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="569"
      height="228"
      viewBox="0 0 569 228"
      fill="none"
      className={className}
    >
      <path
        d="M569 37.1357C569 49.5249 564.068 61.4232 555.302 70.1892L487.231 138.26L479.26 146.231L411.189 214.302C402.423 223.068 390.525 228 378.136 228L-16 228L-16 138.26L409.132 138.26C447.866 138.26 479.26 106.866 479.26 68.1321L479.26 3.92267e-06L569 0L569 37.1357Z"
        fill="url(#paint0_linear_2003_9841)"
      />
      <defs>
        <linearGradient
          id="paint0_linear_2003_9841"
          x1="-16"
          y1="178.5"
          x2="293.759"
          y2="370.89"
          gradientUnits="userSpaceOnUse"
        >
          <stop stopColor="white" stopOpacity="0.3" />
          <stop offset="1" stopColor="white" stopOpacity="0.1" />
        </linearGradient>
      </defs>
    </svg>
  );
}

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

function EcosystemPageNav() {
  return (
    <nav className="absolute top-full grid -translate-y-1/2 grid-flow-col rounded-2xl bg-blue-400 [grid-auto-columns:1fr]">
      <EcosystemPageContent components={ecosystemPageNav} />
    </nav>
  );
}
