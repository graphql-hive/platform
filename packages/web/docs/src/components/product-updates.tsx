import { ReactElement } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { getPageMap } from '@theguild/components/server';

type Changelog = {
  title: string;
  date: string;
  description: string;
  route: string;
};

export async function ProductUpdatesPage() {
  const changelogs = await getChangelogs();

  return (
    <ol className="relative mt-12 border-l border-gray-200 dark:border-gray-700">
      {changelogs.map(item => (
        <ProductUpdateTeaser key={item.route} {...item} />
      ))}
    </ol>
  );
}

function ProductUpdateTeaser(props: Changelog): ReactElement {
  return (
    <li className="mb-10 ml-4">
      <div className="absolute -left-1.5 mt-1.5 size-3 rounded-full border border-white bg-gray-200 dark:border-gray-900 dark:bg-gray-700" />
      <time
        className="mb-1 text-sm font-normal leading-none text-gray-400 dark:text-gray-500"
        dateTime={props.date}
      >
        {format(new Date(props.date), 'do MMMM yyyy')}
      </time>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
        <Link href={props.route}>{props.title}</Link>
      </h3>
      <div className="mb-4 mt-1 max-w-[600px] text-base font-normal leading-6 text-gray-500 dark:text-gray-400">
        {props.description}
      </div>
    </li>
  );
}

async function getChangelogs(): Promise<Changelog[]> {
  const [meta, ...pageMap] = await getPageMap();

  const productUpdatesFolder = pageMap.find(item => item.route === '/product-updates')!.children!;

  return productUpdatesFolder
    .slice(1) // cut `_meta.ts` which always comes first
    .map(item => {
      if (!item.children) {
        if (!('title' in item.frontMatter!)) {
          throw new Error(`Incorrect Front matter on page ${item.route}`);
        }

        // Regular mdx page
        return {
          title: item.frontMatter.title,
          date: item.frontMatter.date.toISOString(),
          description: item.frontMatter.description,
          route: item.route!,
        };
      }
      // Folder
      const indexPage = item.children.find(item => item.name === 'index');
      if (!indexPage) {
        throw new Error('Changelog folder must have an "index.mdx" page');
      }

      if (!('date' in indexPage.frontMatter!)) {
        throw new Error(`Incorrect Front matter on page ${item.route}`);
      }

      return {
        title: indexPage.frontMatter.title,
        date: indexPage.frontMatter.date.toISOString(),
        description: indexPage.frontMatter.description,
        route: indexPage.route!,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
