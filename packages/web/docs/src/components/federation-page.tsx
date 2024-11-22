import { ReactElement, ReactNode } from 'react';
import Image from 'next/image';
import { Anchor, CallToAction, Heading } from '@theguild/components';
import { cn } from '../lib';
import { ArrowIcon } from './arrow-icon';
import { FrequentlyAskedFederationQuestions } from './frequently-asked-questions';
import { Hero, HeroLinks } from './hero';
import { InfoCard } from './info-card';
import { Page } from './page';
import federationDiagram from '../../public/federation-diagram.png';

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
          Learn what GraphQL Federation is and how to combine multiple GraphQL APIs called subgraphs
          into one unified API (supergraph), and serve data from a single endpoint using a GraphQL
          gateway.
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
      <Intro />
      <WhyFederation />
      <HowFederationWorks className="mx-4 md:mx-6" />
      <WhyHive className="mx-4 md:mx-6" />
      <FrequentlyAskedFederationQuestions className="mx-4 md:mx-6" />
      <GetStarted className="mx-4 md:mx-6" />
    </Page>
  );
}

function Intro() {
  return (
    <div className="relative mt-6 sm:mt-[-72px]">
      <section className="border-beige-400 isolate mx-auto w-[1200px] max-w-full rounded-3xl bg-white sm:max-w-[calc(100%-4rem)] sm:border sm:p-6">
        <div className="relative mx-auto flex w-[1392px] max-w-full flex-col gap-x-4 gap-y-6 md:gap-y-12 lg:flex-row [@media(min-width:1400px)]:gap-x-[120px]">
          <div className="flex grow flex-col gap-12 px-4 md:px-0 lg:w-[650px]">
            <Heading as="h2" size="sm" className="text-green-1000">
              Introduction
            </Heading>
            <div className="mx-auto space-y-4 leading-6 text-green-800 lg:space-y-6">
              <p>
                As GraphQL APIs grow, they become harder to maintain. Teams step on each other's
                toes, deployments get risky, and making changes becomes slow.
              </p>
              <p>
                GraphQL federation solves this by letting you break down your monolithic GraphQL API
                into smaller parts, called subgraphs. Each team can work on their domain
                independently and deploy at their own pace.
              </p>
              <p>
                Thanks to a process called schema composition, the integrity of those subgraphs is
                validated and they are combined into one unified schema, the supergraph.
              </p>
              <p>
                GraphQL clients interact with a single endpoint served by GraphQL gateway (sometimes
                called GraphQL router) that resolves data from your federated API.
              </p>
            </div>
            <div className="mx-auto flex flex-row gap-4 lg:mx-0">
              <CallToAction variant="secondary-inverted" href="#why-graphql-federation?">
                Why GraphQL federation?
              </CallToAction>
              <CallToAction
                variant="primary-inverted"
                href="#why-choose-hive-for-graphql-federation?"
              >
                Why choose Hive?
              </CallToAction>
            </div>
          </div>
          <div className="relative mx-4 overflow-hidden rounded-3xl bg-blue-400 md:ml-6 md:mr-0">
            <Image
              width={816} // max rendered width
              height={900} // max rendered height
              src={federationDiagram}
              placeholder="blur"
              blurDataURL={federationDiagram.blurDataURL}
              role="presentation"
              className="mx-auto max-h-[400px] w-auto"
              alt="Diagram showing how GraphQL federation works in a distributed system"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function WhyFederation(props: { className?: string }) {
  return (
    <section className={cn('p-6 sm:py-20 md:py-24', props.className)}>
      <Heading as="h2" size="md" className="text-balance text-center">
        Why GraphQL Federation?
      </Heading>
      <div className="relative mx-auto mt-4 space-y-2 text-center lg:max-w-[880px]">
        <p>
          Federated architecture is a powerful, yet advanced concept. <br />
          It brings quite a lot of complexity, and definitely has some learning curve, but in most
          cases, the benefits are worth it.
        </p>
      </div>
      <ul className="mt-6 flex flex-row flex-wrap justify-center gap-2 md:mt-16 md:gap-6">
        <InfoCard
          as="li"
          heading="Domain-Driven Design"
          icon={<PerformanceListItemIcon />}
          className="flex-1 rounded-2xl md:rounded-3xl"
        >
          <p>
            GraphQL federation is perfect for <strong>domain-driven design</strong> or when you want
            to write GraphQL APIS in <strong>different languages</strong>. It allows teams to
            contribute data from their isolated GraphQL APIs (subgraphs) to the shared space called{' '}
            <strong>Supergraph</strong>.
          </p>
          <p>
            This way, each team can focus on their domain and iterate faster, without being blocked
            by other teams.
          </p>
        </InfoCard>
        <InfoCard
          as="li"
          heading="Scalability"
          icon={<PerformanceListItemIcon />}
          className="flex-1 basis-full rounded-2xl md:basis-0 md:rounded-3xl"
        >
          <p>
            Subgraphs can be scaled independently based on their specific requirements, and deployed
            on their own schedule.
          </p>
          <p>
            Different parts of the API can evolve at different paces, and making changes in the
            GraphQL schema no longer requires coordination between teams.
          </p>
        </InfoCard>
        <InfoCard
          as="li"
          heading="Unified API"
          icon={<PerformanceListItemIcon />}
          className="flex-1 basis-full rounded-2xl md:rounded-3xl lg:basis-0"
        >
          <p>
            Clients interact with a single endpoint, served by a <strong>GraphQL Gateway</strong>{' '}
            (sometimes called Router).
          </p>
          <p>
            The complexity of distributed systems is hidden from the client, and the gateway ensures
            that every query reaches its destination.
          </p>
        </InfoCard>
      </ul>
    </section>
  );
}

const HowFederationWorksVariants = {
  first: {
    number: 1,
    className: 'bg-beige-100 rounded-3xl rounded-b-none',
    headingClassName: 'text-green-1000',
    paragraphClassName: 'text-green-800',
    beforeClassName: null,
    afterClassName: null,
    callToActionVariant: 'secondary-inverted' as const,
  },
  second: {
    number: 2,
    className: 'bg-blue-400',
    headingClassName: 'text-green-1000',
    paragraphClassName: 'text-green-800',
    beforeClassName: 'before:bg-beige-100 before:shadow-blue-400',
    afterClassName: 'after:shadow-beige-100 after:bg-blue-400',
    callToActionVariant: 'secondary-inverted' as const,
  },
  third: {
    number: 3,
    className: 'bg-green-1000 rounded-3xl rounded-t-none',
    headingClassName: 'text-white',
    paragraphClassName: 'text-white/80',
    beforeClassName: 'before:shadow-green-1000 before:bg-blue-400',
    afterClassName: 'after:bg-green-1000 after:shadow-blue-400',
    callToActionVariant: 'secondary-inverted' as const,
  },
};

function HowFederationWorksSection(props: {
  heading: string;
  description: ReactNode;
  callToAction: string;
  callToActionLink: string;
  callToActionTitle: string;
  index: keyof typeof HowFederationWorksVariants;
}) {
  const variant = HowFederationWorksVariants[props.index];

  return (
    <section
      className={cn(
        'relative isolate max-w-full rounded-none px-4 py-6 lg:px-8 lg:py-16 xl:px-16 xl:py-24 [@media(min-width:1358px)]:px-24',
        variant.className,
        variant.beforeClassName
          ? [
              "before:absolute before:-top-24 before:left-0 before:hidden before:size-24 before:rounded-bl-3xl before:shadow-[0_48px_0_0] before:content-[''] before:lg:block",
              variant.beforeClassName,
            ]
          : null,
        variant.afterClassName
          ? [
              "after:absolute after:right-0 after:top-0 after:hidden after:size-24 after:rounded-tr-3xl after:shadow-[0_-48px_0_0] after:content-[''] after:lg:block",
              variant.afterClassName,
            ]
          : null,
      )}
    >
      <div
        className={cn(
          'absolute right-12 top-6 z-10 hidden text-[256px] leading-none opacity-10 lg:block',
          variant.headingClassName,
        )}
      >
        {variant.number}
      </div>
      <div className="mx-auto flex max-w-full flex-col flex-wrap justify-center gap-x-2 lg:max-xl:w-max">
        <Heading
          as="h3"
          size="sm"
          className={cn('max-w-full text-balance', variant.headingClassName)}
        >
          {props.heading}
        </Heading>

        <div
          className={cn('mt-4 w-[700px] max-w-full space-y-2 lg:mt-6', variant.paragraphClassName)}
        >
          {props.description}
        </div>

        <CallToAction
          variant={variant.callToActionVariant}
          href={props.callToActionLink}
          title={props.callToActionTitle}
          className="mt-6 max-xl:order-1 max-md:w-full xl:mt-12"
        >
          {props.callToAction}
          <ArrowIcon />
        </CallToAction>
      </div>
    </section>
  );
}

function HowFederationWorks(props: { className?: string }) {
  return (
    <div className={cn(props.className)}>
      <div>
        <Heading as="h2" size="md" className="text-center">
          How GraphQL Federation Works?
        </Heading>

        <div className="relative mx-auto mt-4 space-y-2 text-center lg:max-w-[880px]">
          <p>
            Federated GraphQL API involves three components: subgraphs, composition and a gateway.
          </p>
          {/* todo: add more */}
        </div>
      </div>
      <div className="mt-6 md:mt-16">
        <HowFederationWorksSection
          index="first"
          heading="Subgraphs"
          description={
            <>
              <p>
                The first of the three components are subgraphs. A subgraph is a standalone GraphQL
                API that can be <strong>developed in any language or framework</strong>, and{' '}
                <strong>deployed independently</strong> from the rest - key benefits of federated
                architecture.
              </p>
              <p>
                The downside of a monolithic GraphQL API is that all teams have to work on the same
                codebase, in the same language, using the same tech stack. On the one hand, it's a
                good thing, because now everyone shares the same knowledge and can help each other.
              </p>
              <p>
                On the other hand, it's a bottleneck as it can slow down the development process, as
                the deployment queue may get longer, and one bad change can take down the whole API
                (or decrease the performance of a deployed instance).
              </p>
              <p>All of the mentioned problems are solved with GraphQL federation.</p>
              <ul className="list-inside list-disc space-y-2">
                <li>Team owns their piece of the GraphQL API</li>
                <li>They gain autonomy</li>
                <li>Teams deploy at their own pace</li>
                <li>Subgraphs are scaled as needed</li>
              </ul>
            </>
          }
          callToAction="Publish subgraphs to Hive"
          callToActionLink="/docs/get-started/apollo-federation#publish-subgraphs"
          callToActionTitle="Start by publishing your subgraphs to Hive"
        />
        <HowFederationWorksSection
          index="second"
          heading="Schema Composition and Registry"
          description={
            <>
              <p>
                The next component, and the most important one, is the schema composition.
                Composition is the process of validating subgraph schemas, combining them into one
                coherent API and ensuring the integrity of the supergraph.
              </p>
              <p>
                This is the{' '}
                <strong>
                  biggest difference between GraphQL federation and other approaches for distributed
                  schemas (like Schema Stitching)
                </strong>
                . With schema composition, you can be sure that all types and fields fit well, and
                avoid surprises in production.
              </p>
              <p>
                <strong>
                  Every possible query, mutation or even a subscription that a client can perform,
                  is checked if it can be resolved by the GraphQL gateway.
                </strong>{' '}
                This allows you to catch all conflicts early, and prevent unexpected exceptions or
                incorrect data in production.
              </p>
              <p>
                The schema composition is most often done with a tool called{' '}
                <strong>Schema Registry</strong>. The Schema Registry is a central place where you
                register your subgraphs (their location and schemas), validate them and combine them
                into a supergraph. It's a crucial part of your GraphQL workflow, and it's a{' '}
                <Anchor
                  className="underline underline-offset-2"
                  title="Learn why your federated GraphQL setup needs a Schema Registry and why you shouldn't build your own"
                  href="https://graphql.org/conf/2024/schedule/af55205b1d68ec3b3d1b1663e4bd2adf/?name=In-House%20Schema%20Registry%20-%20the%20Good%2C%20the%20Bad%2C%20and%20the%20Ugly"
                >
                  must-have for any GraphQL federation setup
                </Anchor>
                .
              </p>
            </>
          }
          callToAction="Read about the Schema Registry"
          callToActionLink="/docs/schema-registry"
          callToActionTitle="Learn how to use Schema Registry to compose your schema and validate it"
        />
        <HowFederationWorksSection
          index="third"
          heading="GraphQL Gateway (Router)"
          description={
            <>
              <p>
                <strong>
                  The promise of GraphQL federation is to have a unified API and serve data from a
                  single endpoint.
                </strong>{' '}
                GraphQL gateway, sometimes called GraphQL router, enables that.
              </p>
              <p>
                The result of schema composition is a supergraph schema. It's stored in the schema
                registry and contains all the types and fields, but also information about which
                subgraph and how to resolve them.
              </p>
              <h4 className="pt-2 text-lg font-semibold text-white">Query Planning</h4>
              <p>
                The process of resolving GraphQL requests is called query planning. During the query
                planning, the gateway decides which subgraph should resolve a given part of the
                query, and then sends the query to the appropriate subgraph. The subgraph resolves
                the query and returns the data. The gateway then combines all the data and returns
                it to the client in a single response.
              </p>
              <h4 className="pt-2 text-lg font-semibold text-white">
                What a Good Gateway Should Offer?
              </h4>
              <p>
                GraphQL router is a crucial part of your federated GraphQL setup. It's the entry
                point for all your GraphQL consumers. It has to be fast, reliable and secure.
              </p>
              <p>
                A good GraphQL gateway should offer features like JSON Web Tokens (JWT)
                authentication, role-based access control (RBAC), and a good observability story. It
                should be able to handle a large number of requests.
              </p>
              <h4 className="pt-2 text-lg font-semibold text-white">
                Specification Compliance - Very Important
              </h4>
              <p>
                A critical yet often overlooked aspect of the GraphQL gateway is its correctness and
                compliance with the Apollo Federation specification. The Federation's effectiveness
                depends on the gateway's ability to correctly resolve queries, mutations and
                subscriptions.
              </p>
              <p>
                When choosing a federation gateway, verify its compliance with the Apollo Federation
                specification. This will help you prevent unexpected runtime behavior and data
                resolution failures.
              </p>
              <p>
                <Anchor
                  className="underline underline-offset-2"
                  href="https://the-guild.dev"
                  title="Company behind Hive"
                >
                  The Guild
                </Anchor>{' '}
                maintains{' '}
                <Anchor
                  className="underline underline-offset-2"
                  href="https://the-guild.dev/graphql/hive/federation-gateway-audit"
                >
                  an open-source Federation Testing Suite
                </Anchor>{' '}
                to verify the gateway's specification compliance. This test suite helps ensure your
                gateway correctly implements federation features beyond basic directive support.
              </p>
            </>
          }
          callToAction="Discover Hive Gateway"
          callToActionLink="/docs/gateway"
          callToActionTitle="Learn how to use Hive Gateway to serve your supergraph to clients"
        />
      </div>
    </div>
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
      <Heading as="h2" size="md" className="text-balance sm:px-6 sm:text-center">
        Why Choose Hive for GraphQL Federation?
      </Heading>
      <ul className="flex flex-row flex-wrap justify-center divide-y divide-solid sm:mt-6 sm:divide-x sm:divide-y-0 md:mt-16 md:px-6 xl:px-16">
        <InfoCard
          as="li"
          heading="Complete Federation Stack"
          icon={<PerformanceListItemIcon />}
          className="flex-1 text-balance px-0 sm:px-8 sm:py-0 md:px-8 md:py-0"
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
          heading="True Open Source"
          icon={<PerformanceListItemIcon />}
          className="flex-1 basis-full text-balance px-0 sm:basis-0 sm:px-8 sm:py-0 md:px-8 md:py-0"
        >
          <div>
            <ul className="space-y-2">
              <li>
                <span className="font-semibold">No Vendor Lock-in — </span> Every component works
                independently with other vendors (including Apollo GraphOS).
              </li>
              <li>
                <span className="font-semibold">MIT License — </span> All components are available
                under the permissive MIT license.
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
          heading="Enterprise Tooling for GraphQL"
          icon={<PerformanceListItemIcon />}
          className="flex-1 text-balance px-0 sm:px-8 sm:py-0 md:px-8 md:py-0"
        >
          <div>
            <ul className="space-y-2">
              <li>
                <span className="font-semibold">Single Sign-On — </span> Integrated with popular
                providers like Okta, to enable OpenID Connect login for maximum security.
              </li>
              <li>
                <span className="font-semibold">Security and Compliance — </span> Access control
                with role-based access control (RBAC), JSON Web Tokens (JWT) and Persisted
                Operations.
              </li>
              <li>
                <span className="font-semibold">Audit logs — </span>
                Keep track of all the changes made to your organization.
              </li>
            </ul>
          </div>
        </InfoCard>
      </ul>
    </section>
  );
}

function GetStarted(props: { className?: string }) {
  return (
    <section
      className={cn(
        'relative overflow-hidden rounded-3xl p-12 text-center sm:p-24',
        props.className,
      )}
    >
      <Heading as="h2" size="md">
        Get Started with GraphQL Federation
      </Heading>
      <p className="relative mt-4">
        Start building your federated GraphQL API today, by following our guide, that will walk you
        through the basics of Apollo Federation.
      </p>
      <CallToAction
        variant="primary"
        className="mx-auto mt-8"
        href="/docs/get-started/apollo-federation"
      >
        Start building now
      </CallToAction>
    </section>
  );
}
