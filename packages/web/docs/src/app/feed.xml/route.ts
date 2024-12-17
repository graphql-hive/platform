import fs from 'node:fs/promises';
import path from 'node:path';
// eslint-disable-next-line import/no-extraneous-dependencies
import RSS from 'rss';
import { getChangelogs } from '../../components/product-updates';

// Generate a TypeScript file with the latest changelogs
const outputFilePath = path.resolve(
  '..',
  'app',
  'src',
  'components',
  'ui',
  'changelog',
  'generated-changelog.ts',
);

export async function GET() {
  const feed = new RSS({
    title: 'Hive Changelog',
    site_url: 'https://the-guild.dev/graphql/hive',
    feed_url: 'https://the-guild.dev/graphql/hive/feed.xml',
  });

  const changelogs = await getChangelogs();

  for (const item of changelogs) {
    feed.item({
      title: item.title,
      date: item.date,
      url: `https://the-guild.dev/graphql/hive${item.route}`,
      description: item.description,
    });
  }
  // Sort changelogs by date and get the latest 4 records
  const latestChangelog = [...changelogs]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 4)
    .map(item => ({
      date: new Date(item.date).toLocaleDateString('en', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
      href: `https://the-guild.dev/graphql/hive${item.route}`,
      title: item.title,
      description: item.description,
    }));

  const outputContent = `export const latestChangelog = ${JSON.stringify(latestChangelog, null, 2)};\n`;
  await fs.writeFile(outputFilePath, outputContent, 'utf8');
  console.info(`Generated successfully at: ${path.relative(process.cwd(), outputFilePath)}`);

  return new Response(feed.xml({ indent: true }), {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
    },
  });
}

export const dynamic = 'force-static';
export const config = { runtime: 'edge' };
