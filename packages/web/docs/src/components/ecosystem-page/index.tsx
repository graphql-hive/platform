import { DecorationIsolation, Heading } from '@theguild/components';
import { Page } from '../page';

export function EcosystemPage({ children }: { children: React.ReactNode }) {
  return (
    <Page className="text-green-1000 light mx-auto max-w-[90rem] overflow-hidden">{children}</Page>
  );
}

export const components = Object.freeze({
  EcosystemHeader: (props: React.HTMLAttributes<HTMLDivElement>) => (
    <header
      className="relative isolate flex max-w-[90rem] flex-col items-center gap-6 overflow-hidden rounded-3xl bg-blue-400 px-4 py-6 text-center sm:py-12 md:gap-8 lg:py-24 [&>h1]:max-w-[800px] [&>p]:max-w-[520px]"
      {...props}
    >
      <span className="font-medium">The Ecosystem</span>
      {props.children}
      <CrossDecoration />
    </header>
  ),
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => <Heading as="h1" size="xl" {...props} />,
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <Heading as="h2" size="xs" className="mt-24" {...props} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => null,
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="text-green-800" {...props} />
  ),
});

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
          <stop stop-color="white" stop-opacity="0.3" />
          <stop offset="1" stop-color="white" stop-opacity="0.1" />
        </linearGradient>
      </defs>
    </svg>
  );
}
