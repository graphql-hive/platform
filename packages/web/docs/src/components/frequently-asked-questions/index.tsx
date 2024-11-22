import { Children, ComponentPropsWithoutRef } from 'react';
import * as RadixAccordion from '@radix-ui/react-accordion';
import { ChevronDownIcon } from '@radix-ui/react-icons';
import { Anchor, Heading } from '@theguild/components';
import { cn, usePageFAQSchema } from '../../lib';
import FederationQuestions from './federation-questions.mdx';
import HomeQuestions from './home-questions.mdx';

const a = (props: ComponentPropsWithoutRef<'a'>) => (
  <Anchor
    className="hive-focus rounded underline hover:text-blue-700"
    {...props}
    href={props.href!}
  >
    {props.children!}
  </Anchor>
);

const h2 = (props: ComponentPropsWithoutRef<'h2'>) => (
  <Heading as="h2" size="md" className="basis-1/2" {...props} />
);

const Accordion = (props: ComponentPropsWithoutRef<'ul'>) => (
  <RadixAccordion.Root asChild type="single" collapsible>
    <ul className="basis-1/2 divide-y max-xl:grow" {...props} />
  </RadixAccordion.Root>
);

const AccordionItem = (props: ComponentPropsWithoutRef<'li'>) => {
  const texts = Children.toArray(props.children)
    .map(child =>
      typeof child === 'object' && 'type' in child && child.type === 'p'
        ? (child.props.children as string)
        : null,
    )
    .filter(Boolean);

  if (texts.length === 0) {
    return null;
  }

  if (texts.length < 2) {
    console.error(texts);
    throw new Error(`Expected a question and an answer, got ${texts.length} items`);
  }

  const [question, ...answers] = texts;

  if (!question) return null;

  return (
    <RadixAccordion.Item
      asChild
      value={question}
      className="rdx-state-open:pb-4 relative pb-0 focus-within:z-10"
      itemScope
      itemProp="mainEntity"
      itemType="https://schema.org/Question"
    >
      <li>
        <RadixAccordion.Header>
          <RadixAccordion.Trigger className="hive-focus hover:bg-beige-100/80 -mx-2 my-1 flex w-[calc(100%+1rem)] items-center justify-between rounded-xl bg-white px-2 py-3 text-left font-medium transition-colors duration-[.8s] md:my-2 md:py-4">
            <span itemProp="name">{question}</span>
            <ChevronDownIcon className="size-5 [[data-state='open']_&]:[transform:rotateX(180deg)]" />
          </RadixAccordion.Trigger>
        </RadixAccordion.Header>
        <RadixAccordion.Content
          forceMount
          className="overflow-hidden bg-white text-green-800 data-[state=closed]:hidden"
          itemScope
          itemProp="acceptedAnswer"
          itemType="https://schema.org/Answer"
        >
          <div itemProp="text" className="space-y-2">
            {answers.map((answer, i) => (
              <p key={i}>{answer}</p>
            ))}
          </div>
        </RadixAccordion.Content>
      </li>
    </RadixAccordion.Item>
  );
};

const components = {
  a,
  h2,
  ul: Accordion,
  li: AccordionItem,
};

export function FrequentlyAskedQuestions({ className }: { className?: string }) {
  usePageFAQSchema();

  return (
    <>
      <section
        className={cn(
          className,
          'text-green-1000 flex flex-col gap-x-6 gap-y-2 px-4 py-6 md:flex-row md:px-10 lg:gap-x-24 lg:px-[120px] lg:py-24',
        )}
      >
        <HomeQuestions components={components} />
      </section>
    </>
  );
}

const federationUL = (props: ComponentPropsWithoutRef<'ul'>) => {
  return <ul className="space-y-8" {...props} />;
};

const federationLI = (props: ComponentPropsWithoutRef<'li'>) => {
  const texts = Children.toArray(props.children)
    .map(child =>
      typeof child === 'object' && 'type' in child && child.type === 'p'
        ? (child.props.children as string)
        : null,
    )
    .filter(Boolean);

  if (texts.length === 0) {
    return null;
  }

  if (texts.length < 2) {
    console.error(texts);
    throw new Error(`Expected a question and an answer, got ${texts.length} items`);
  }

  const [question, ...answers] = texts;

  if (!question) return null;

  return (
    <li itemScope itemProp="mainEntity" itemType="https://schema.org/Question">
      <h3 className="pb-2 text-left font-medium" itemProp="name">
        {question}
      </h3>
      <div
        className="mx-4 overflow-hidden bg-white text-green-800"
        itemScope
        itemProp="acceptedAnswer"
        itemType="https://schema.org/Answer"
      >
        <div itemProp="text" className="max-w-[700px] space-y-2">
          {answers.map((answer, i) => (
            <p key={i}>{answer}</p>
          ))}
        </div>
      </div>
    </li>
  );
};

const federationComponents = {
  a,
  h2,
  ul: federationUL,
  li: federationLI,
};

export function FrequentlyAskedFederationQuestions({ className }: { className?: string }) {
  usePageFAQSchema();

  return (
    <>
      <section
        className={cn(
          className,
          'text-green-1000 flex flex-col gap-x-8 gap-y-8 px-4 py-6 md:px-14 lg:flex-row lg:px-[120px] lg:py-24',
        )}
      >
        <FederationQuestions components={federationComponents} />
      </section>
    </>
  );
}
