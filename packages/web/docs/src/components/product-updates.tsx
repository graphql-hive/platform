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

// TODO: I'm not sure this is gonna work. We previously imported Nextra internal here.
export async function getChangelogs(): Promise<Changelog[]> {
  const [_meta, ...pageMap] = await getPageMap();

  type PageMapItem = (typeof pageMap)[number];
  type Folder = PageMapItem & { children: PageMapItem[] };

  const productUpdatesFolder = pageMap.find(
    (item): item is Folder =>
      'route' in item && item.route === '/product-updates' && 'children' in item,
  )!.children!;

  const getDateISOStringFromFrontmatter = (
    item: { name: string },
    frontMatter: { date?: Date | string; timestamp?: number },
  ) => {
    try {
      return new Date(
        frontMatter.date || frontMatter.timestamp || item.name.slice(0, 10),
      ).toISOString();
    } catch (error) {
      console.error(`Error parsing date \`${frontMatter.date}\` for ${item.name}: ${error}`);
      throw error;
    }
  };

  return productUpdatesFolder
    .slice(1) // cut `_meta.ts` which always comes first
    .map(item => {
      if (!('children' in item) && 'route' in item) {
        const frontMatter = (item as any).frontMatter as {
          title: string;
          date?: Date;
          description: string;
        };

        if (!frontMatter.title) {
          throw new Error(`Incorrect Front matter on page ${item.route}`);
        }

        // Regular mdx page
        return {
          title: frontMatter.title,
          date: getDateISOStringFromFrontmatter(item, frontMatter),
          description: frontMatter.description,
          route: item.route!,
        };
      }

      // Folder
      const indexPage =
        'children' in item
          ? (item as Folder).children.find(item => 'name' in item && item.name === 'index')
          : null;

      if (!indexPage) {
        throw new Error('Changelog folder must have an "index.mdx" page');
      }

      const route = (indexPage as typeof indexPage & { route: string }).route;
      const frontMatter = (indexPage as any).frontMatter as {
        title: string;
        date: Date;
        description: string;
      };

      if (!frontMatter.title) {
        throw new Error(`Incorrect Front matter on page ${route}`);
      }

      return {
        title: frontMatter.title,
        date: frontMatter.date!.toISOString(),
        description: frontMatter.description,
        route: route!,
      };
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}
