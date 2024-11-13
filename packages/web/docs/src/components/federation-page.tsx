import { ReactElement } from 'react';
import { CallToAction, Heading } from '@theguild/components';
import { cn } from '../lib';
import { ArrowIcon } from './arrow-icon';
import { FrequentlyAskedFederationQuestions } from './frequently-asked-questions';
import { Hero, HeroLinks } from './hero';
import { InfoCard } from './info-card';
import { Page } from './page';

export function FederationPage(): ReactElement {
  return (
    <Page className="text-green-1000 light mx-auto max-w-[90rem] overflow-hidden">
      <Hero className="mx-4 max-sm:mt-2 md:mx-6">
        <Heading
          as="h1"
          size="xl"
          className="mx-auto max-w-3xl text-balance text-center text-white"
        >
          GraphQL Federation
        </Heading>
        <p className="mx-auto w-[512px] max-w-[80%] text-center leading-6 text-white/80">
          GraphQL federation simplifies API management in distributed systems, uniting multiple
          services into a single, scalable GraphQL API.
        </p>

        <HeroLinks>
          <CallToAction variant="primary-inverted" href="/docs/get-started/apollo-federation">
            Get started
          </CallToAction>
          <CallToAction
            variant="secondary"
            href="https://the-guild.dev/blog/federation-gateway-audit"
          >
            Hive is 100% compatible!
          </CallToAction>
        </HeroLinks>
      </Hero>
      <div className="relative mt-6 sm:mt-[-72px]">
        <section className="border-beige-400 isolate mx-auto w-[1200px] max-w-full rounded-3xl bg-white sm:max-w-[calc(100%-4rem)] sm:border sm:p-6">
          <div className="relative mx-auto flex w-[1392px] max-w-full flex-col gap-x-4 gap-y-6 md:gap-y-12 lg:flex-row [@media(min-width:1400px)]:gap-x-[120px]">
            <div className="flex flex-col gap-12 px-4 md:px-0 lg:w-[488px]">
              <Heading as="h3" size="sm" className="text-green-1000">
                Connect and Unify APIs
              </Heading>
              <div className="mx-auto flex basis-full flex-col gap-y-4 leading-6 text-green-800 lg:gap-y-6">
                <p>
                  As GraphQL APIs grow, they become harder to maintain. Teams step on each other's
                  toes, deployments get risky, and making changes becomes slow.
                </p>
                <p>
                  GraphQL federation solves this by letting you split your GraphQL API into smaller
                  pieces that work together.
                </p>
                <p>
                  Clients interact with a single endpoint that serves as one unified API. The
                  GraphQL gateway seamlessly coordinates requests between all services.
                </p>
              </div>
              {/* <div className="bottom-0 flex w-full flex-col gap-x-4 gap-y-2 max-lg:absolute max-lg:translate-y-[calc(100%+24px)] sm:flex-row">
                <CallToAction
                  href="https://the-guild.dev/graphql/hive/docs/use-cases/apollo-studio"
                  variant="primary-inverted"
                >
                  CTA
                </CallToAction>
              </div> */}
            </div>
            <div className="relative mx-4 h-full flex-1 overflow-hidden rounded-3xl bg-blue-400 max-sm:h-[290px] sm:min-h-[400px] md:ml-6 md:mr-0"></div>
          </div>
        </section>
      </div>
      <section className="p-6 sm:py-20 md:py-24">
        <Heading as="h3" size="md" className="text-balance text-center">
          Why GraphQL Federation?
        </Heading>
        <ul className="mt-6 flex flex-row flex-wrap justify-center gap-2 md:mt-16 md:gap-6">
          <InfoCard
            as="li"
            heading="Autonomy"
            icon={<PerformanceListItemIcon />}
            className="flex-1 rounded-2xl md:rounded-3xl"
          >
            GraphQL federation is perfect for domain-driven design, allowing teams to work
            contribute individual GraphQL APIs in any language to a cohesive GraphQL API.
          </InfoCard>
          <InfoCard
            as="li"
            heading="Scalability"
            icon={<PerformanceListItemIcon />}
            className="flex-1 basis-full rounded-2xl md:basis-0 md:rounded-3xl"
          >
            Individual GraphQL APIs can be scaled independently based on their specific
            requirements.
          </InfoCard>
          <InfoCard
            as="li"
            heading="Unified API"
            icon={<PerformanceListItemIcon />}
            className="flex-1 basis-full rounded-2xl md:rounded-3xl lg:basis-0"
          >
            Clients get a seamless, unified experience. The complexity is hidden behind a single
            endpoint.
          </InfoCard>
        </ul>
      </section>
      <div className="mx-4 md:mx-6">
        <div>
          <Heading as="h2" size="md" className="text-center">
            How GraphQL Federation Works?
          </Heading>
        </div>
        <section className="bg-beige-100 relative isolate mt-6 max-w-full rounded-3xl rounded-b-none px-4 py-6 md:mt-16 lg:px-8 lg:py-16 xl:px-16 xl:py-24 [@media(min-width:1358px)]:px-24">
          <div className="mx-auto flex max-w-full flex-col flex-wrap justify-center gap-x-2 lg:max-xl:w-max">
            <Heading
              as="h3"
              size="md"
              className="text-green-1000 max-w-full text-balance xl:w-[468px]"
            >
              Own Your Domain, Choose Your Stack
            </Heading>

            <p className="mt-4 w-[468px] max-w-full text-green-800 lg:mt-6">
              With GraphQL federation, each team owns their piece of the GraphQL API. They gain
              autonomy that let's them deploy on their own schedule, scale as needed and use tech
              stack that fits their needs.
            </p>

            <CallToAction
              variant="secondary-inverted"
              href="/docs/get-started/apollo-federation#publish-subgraphs"
              className="max-xl:order-1 max-md:w-full xl:mt-12"
            >
              Publish subgraphs to Hive
              <ArrowIcon />
            </CallToAction>
          </div>
        </section>
        {/*  */}
        <section
          className={cn(
            'relative isolate max-w-full rounded-none bg-blue-400 px-4 py-6 lg:px-8 lg:py-16 xl:px-16 xl:py-24 [@media(min-width:1358px)]:px-24',
            "before:bg-beige-100 before:absolute before:-top-24 before:left-0 before:hidden before:h-24 before:w-24 before:rounded-bl-3xl before:shadow-[0_48px_0_0] before:shadow-blue-400 before:content-[''] before:lg:block",
            "after:shadow-beige-100 after:absolute after:right-0 after:top-0 after:hidden after:h-24 after:w-24 after:rounded-tr-3xl after:bg-blue-400 after:shadow-[0_-48px_0_0] after:content-[''] after:lg:block",
          )}
        >
          <div className="mx-auto flex max-w-full flex-col flex-wrap justify-center gap-x-2 lg:max-xl:w-max">
            <Heading
              as="h3"
              size="md"
              className="text-green-1000 max-w-full text-balance xl:w-[468px]"
            >
              Bringing It All Together
            </Heading>

            <p className="mt-4 w-[468px] max-w-full text-green-800 lg:mt-6">
              GraphQL federation involves schema composition to combine separate GraphQL schemas
              into one coherent API. Teams can reference types from other services and the
              composition process ensures all pieces fit together. All conflicts are caught early
              during development, saving you from production issues.
            </p>

            <CallToAction
              variant="secondary-inverted"
              href="/docs/schema-registry"
              className="max-xl:order-1 max-md:w-full xl:mt-12"
            >
              Read about Schema Registry
              <ArrowIcon />
            </CallToAction>
          </div>
        </section>
        {/*  */}

        <section
          className={cn(
            'bg-green-1000 relative isolate max-w-full rounded-3xl rounded-t-none px-4 py-6 text-white lg:px-8 lg:py-16 xl:px-16 xl:py-24 [@media(min-width:1358px)]:px-24',
            "before:shadow-green-1000 before:absolute before:-top-24 before:left-0 before:hidden before:h-24 before:w-24 before:rounded-bl-3xl before:bg-blue-400 before:shadow-[0_48px_0_0] before:content-[''] before:lg:block",
            "after:bg-green-1000 after:absolute after:right-0 after:top-0 after:hidden after:h-24 after:w-24 after:rounded-tr-3xl after:shadow-[0_-48px_0_0] after:shadow-blue-400 after:content-[''] after:lg:block",
          )}
        >
          <div className="mx-auto flex max-w-full flex-col flex-wrap justify-center gap-x-2 lg:max-xl:w-max">
            <Heading as="h3" size="md" className="max-w-full text-balance text-white xl:w-[468px]">
              Single, Unified API
            </Heading>

            <p className="mt-4 w-[468px] max-w-full text-white/80 lg:mt-6">
              Thanks to GraphQL gateway, clients get a single endpoint with unified schema. The
              complexity of distributed systems is hidden. The gateway ensures every query reaches
              its destination and returns with the right data.
            </p>

            <CallToAction
              variant="secondary-inverted"
              href="/docs/gateway"
              className="max-xl:order-1 max-md:w-full xl:mt-12"
            >
              Discover Hive Gateway
              <ArrowIcon />
            </CallToAction>
          </div>
        </section>
      </div>
      <WhyHive className="mx-4 md:mx-6" />
      <FrequentlyAskedFederationQuestions className="mx-4 md:mx-6" />
      <section
        className={'relative mx-4 overflow-hidden rounded-3xl p-12 text-center sm:p-24 md:mx-6'}
      >
        <Heading as="h3" size="md">
          Get Started with GraphQL Federation
        </Heading>
        <p className="relative mt-4">
          Start building your federated GraphQL API today, by following our guide, that will walk
          you through the basics of Apollo Federation.
        </p>
        <CallToAction
          variant="primary"
          className="mx-auto mt-8"
          href="/docs/get-started/apollo-federation"
        >
          Start building now
        </CallToAction>
      </section>
    </Page>
  );
}

function PerformanceListItemIcon() {
  return (
    <svg width="24" height="24" fill="currentColor">
      <path d="M5.25 7.5a2.25 2.25 0 1 1 3 2.122v4.756a2.251 2.251 0 1 1-1.5 0V9.622A2.25 2.25 0 0 1 5.25 7.5Zm9.22-2.03a.75.75 0 0 1 1.06 0l.97.97.97-.97a.75.75 0 1 1 1.06 1.06l-.97.97.97.97a.75.75 0 0 1-1.06 1.06l-.97-.97-.97.97a.75.75 0 1 1-1.06-1.06l.97-.97-.97-.97a.75.75 0 0 1 0-1.06Zm2.03 5.03a.75.75 0 0 1 .75.75v3.128a2.251 2.251 0 1 1-1.5 0V11.25a.75.75 0 0 1 .75-.75Z" />
    </svg>
  );
}

function WhyHive({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        'bg-beige-100 mt-6 rounded-3xl px-4 pt-6 sm:py-24 md:px-6 md:py-[120px]',
        className,
      )}
    >
      <Heading as="h3" size="md" className="text-balance sm:px-6 sm:text-center">
        Why Choose Hive for GraphQL Federation?
      </Heading>
      <ul className="flex flex-row flex-wrap justify-center divide-y divide-solid sm:mt-6 sm:divide-x sm:divide-y-0 md:mt-16 md:px-6 xl:px-16">
        <InfoCard
          as="li"
          heading="Complete Federation Stack"
          icon={<PerformanceListItemIcon />}
          className="flex-1 px-0 sm:px-8 sm:py-0 md:px-8 md:py-0"
        >
          <div>
            <ul className="space-y-2">
              <li>
                <span className="font-semibold">Gateway — </span> efficiently serve data from your
                federated graph.
              </li>
              <li>
                <span className="font-semibold">Schema Registry — </span> ensure consistency and
                compatibility across your federated graph.
              </li>
              <li>
                <span className="font-semibold">Observability — </span> monitor supergraph
                performance and schema usage.
              </li>
            </ul>
          </div>
        </InfoCard>
        <InfoCard
          as="li"
          heading="Unmatched Flexibility"
          icon={<PerformanceListItemIcon />}
          className="flex-1 basis-full px-0 sm:basis-0 sm:px-8 sm:py-0 md:px-8 md:py-0"
        >
          <div>
            <ul className="space-y-2">
              <li>
                <span className="font-semibold">Mix and Match — </span> Every component works
                independently with other vendors (including Apollo GraphOS).
              </li>
              <li>
                <span className="font-semibold">No Vendor Lock-in — </span> Switch components or
                integrate with existing tools without rewriting your infrastructure.
              </li>
              <li>
                <span className="font-semibold">Full Control — </span> Self-host any component or
                use our cloud offering.
              </li>
            </ul>
          </div>
        </InfoCard>
        <InfoCard
          as="li"
          heading="True Open Source"
          icon={<PerformanceListItemIcon />}
          className="flex-1 px-0 sm:px-8 sm:py-0 md:px-8 md:py-0"
        >
          <div>
            <ul className="space-y-2">
              <li>
                <span className="font-semibold">MIT License — </span> All components are available
                under the permissive MIT license
              </li>
              <li>
                <span className="font-semibold">Transparent Development — </span> Active community
                participation in our development process
              </li>
              <li>
                <span className="font-semibold">Commercial-Grade — </span> Enterprise features
                available out-of-the-box in the open-source version
              </li>
            </ul>
          </div>
        </InfoCard>
      </ul>
    </section>
  );
}
