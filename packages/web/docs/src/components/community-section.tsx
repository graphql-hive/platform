import Image, { StaticImageData } from 'next/image';
import { GlobeIcon } from '@radix-ui/react-icons';
import { CallToAction, DiscordIcon, GitHubIcon, TwitterIcon } from '@theguild/components';
import { cn } from '../lib';
import { Heading } from './heading';
import { MaskingScrollview } from './masking-scrollview';
import Achrafash from './community-section/achrafash_.png';
import ChimameRt from './community-section/chimame_rt.png';
import Daniel2Color from './community-section/daniel2color.jpg';
import FlexDinesh from './community-section/flexdinesh.jpg';
import GetHackTeam from './community-section/gethackteam.jpg';
import Malgamves from './community-section/malgamves.jpg';
import Michlbrmly from './community-section/michbrmly.png';
import NicolasKa3 from './community-section/NicolasKa3.jpg';
import ReardenQL from './community-section/ReardenQL.jpg';
import ScottBolinger from './community-section/scottboilinger.png';
import TheWritingDev from './community-section/thewritingdev.png';
import WhereIsCharly from './community-section/whereischarly.jpg';

export function CommunitySection({ className }: { className?: string }) {
  return (
    <section
      className={cn('bg-green-1000 rounded-3xl px-4 py-6 lg:px-8 lg:py-16 xl:p-24', className)}
    >
      <Heading as="h2" size="sm" className="text-balance text-white lg:text-center">
        Community-driven Open Source
      </Heading>
      <p className="mt-4 text-white/80 lg:text-center">
        Supported by a network of early advocates, contributors, and champions.
      </p>
      <div className="my-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:my-24 lg:grid-cols-4">
        <CommunityCard
          title="GitHub integration"
          description="Our CLI integrates smoothly with GitHub Actions / repositories."
        >
          <CallToAction
            variant="primary-inverted"
            href="https://github.com/kamilkisiela/graphql-hive/discussions"
            target="_blank"
            rel="noreferrer"
          >
            <GitHubIcon className="size-6" />
            GitHub Discussions
          </CallToAction>
        </CommunityCard>
        <CommunityCard
          title="Impactful community"
          description="Implement your own features with our help"
        >
          <CallToAction
            variant="secondary"
            href="https://discord.com/invite/xud7bH9"
            target="_blank"
            rel="noreferrer"
          >
            <DiscordIcon className="size-6" />
            Discord
          </CallToAction>
        </CommunityCard>
        <CommunityCard title="Public roadmap" description="Influence the future of Hive">
          <CallToAction
            variant="secondary-inverted"
            href="https://the-guild.dev/graphql/hive/product-updates"
            target="_blank"
            rel="noreferrer"
          >
            Product Updates
          </CallToAction>
        </CommunityCard>
        <CommunityCard
          title="Available for free"
          description="Free Hobby plan that fits perfectly for most side projects."
        >
          <CallToAction variant="secondary-inverted" href="/#pricing">
            Check Pricing
          </CallToAction>
        </CommunityCard>
      </div>
      <MaskingScrollview
        outerClassName="max-sm:-mx-4 max-sm:px-4 "
        className="relative -m-4 flex flex-row gap-6 p-4 max-sm:overflow-x-auto sm:grid sm:h-[600px] sm:grid-cols-2 sm:overflow-y-auto lg:grid-cols-4"
        fade="y"
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div className="contents flex-col gap-6 sm:flex max-lg:[&>:last-child]:flex-1" key={i}>
            {socialPosts.map((post, j) =>
              j % 4 === i ? <SocialPostCard post={post} key={j} /> : null,
            )}
          </div>
        ))}
      </MaskingScrollview>
      <footer className="mt-8 text-green-200">
        <p className="text-center text-sm">Join professionals from companies like</p>
        <div className="mx-auto mt-6 flex w-fit max-w-full flex-row flex-wrap items-center justify-center gap-6">
          <TheGraphCombomark />
          <ParseCombomark />
          <SequenceCombomark />
          <DaletCombomark />
          <OutreachCombomark />
        </div>
      </footer>
    </section>
  );
}

function CommunityCard(props: { title: string; description: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col">
      <p className="font-medium text-white">{props.title}</p>
      <p className="mb-4 mt-2 flex-1 text-white/80">{props.description}</p>
      {props.children}
    </div>
  );
}

type SocialPost = {
  name: string;
  avatar: string;
  text: string;
  href: string;
};

const SocialPost = {
  fromTweet(href: string, text: string, avatar: StaticImageData | string): SocialPost {
    // https://x.com/scottbolinger/status/1623466404610719744
    const handle = href.split('/')[3];
    return {
      href,
      avatar: typeof avatar === 'string' ? avatar : avatar.src,
      name: `@${handle}`,
      text,
    };
  },
};

const socialPosts: SocialPost[] = [
  SocialPost.fromTweet(
    'https://x.com/malgamves/status/1272959879054049280',
    "I was playing around with @strapijs's GraphQL API & got an error I'd never seen. According to @apollographql heuristic queries are a thing? Shoutout to @TheGuildDev 🧙🏿‍♂️for building GraphQL CodeGen, it's literally magic 🪄 Lost? I explain it all here 👇🏿 https://blog.logrocket.com/using-code-gen-to-avoid-heuristic-graphql-queries/",
    Malgamves,
  ),
  SocialPost.fromTweet(
    'https://x.com/thewritingdev/status/1705160937697689706',
    "GraphQL Yoga by @TheGuildDev is THE way to start new GraphQL projects now. Especially since other similar projects are going the closed-source route, Yoga is the current champion of true Open Source. It's a batteries-included, cross-platform, and runs anywhere!!",
    TheWritingDev,
  ),
  SocialPost.fromTweet(
    'https://x.com/scottbolinger/status/1623466404610719744',
    'Having fully typed API data is pretty awesome, thanks to urql and graphql-codegen',
    ScottBolinger,
  ),

  SocialPost.fromTweet(
    'https://x.com/achrafash_/status/1526654279062278146',
    'Yoga 2.0 makes it dead simple to build a GraphQL API in NextJS!! and no need to put `any` everywhere to make it work lol. ty @TheGuildDev 🙏',
    Achrafash,
  ),
  SocialPost.fromTweet(
    'https://x.com/daniel2color/status/1408064880377143297',
    `.
@TheGuildDev
 gave me a demo of GraphQL Hive as part of my research on GraphQL observability with Prisma

It's an immensely useful tool:
- Performance metrics 📈
- Schema registry to track schema changes 🛠
- GraphQL observability

Can't wait to try it 🤩
https://graphql-hive.com`,
    Daniel2Color,
  ),
  SocialPost.fromTweet(
    'https://x.com/NicolasKa3/status/1502204138188378114',
    "Just contributed to @TheGuildDev by fixing a bug in the GraphQL TypeScript types generator. It's not much but it feels very good to give back 🥳",
    NicolasKa3,
  ),
  SocialPost.fromTweet(
    'https://x.com/flexdinesh/status/1602776469071355906',
    'The smart folks at @TheGuildDev have introduced a compiler to write GraphQL schema. The extended file format is .graphxql. https://the-guild.dev/blog/graphqxl-language',
    FlexDinesh,
  ),
  //
  SocialPost.fromTweet(
    'https://x.com/whereischarly/status/1349467930166239232',
    "Sooo, I'm on a good way for `spotify-graphql@2.0.0` that will cover all endpoints of @Spotify API (queries + mutations) 🤓 Thanks to the combination of my `functional-json-schema` lib and GraphQL Mesh (@TheGuildDev), it's now so much easier to maintain ✨",
    WhereIsCharly,
  ),
  SocialPost.fromTweet(
    'https://x.com/gethackteam/status/1255062494411964416',
    "If you're using REST APIs with Swagger or OpenAPI, make sure to check out GraphQL Mesh https://medium.com/the-guild/graphql-mesh-query-anything-run-anywhere-433c173863b5",
    GetHackTeam,
  ),
  SocialPost.fromTweet(
    'https://x.com/michlbrmly/status/1313037429314551809',
    '@TheGuildDev Just updated a project from angular-apollo v1.5 -> v2. Really impressed with the use of schematics to automatically update Apollo Client, import paths etc. Nice work!',
    Michlbrmly,
  ),
  SocialPost.fromTweet(
    'https://x.com/ReardenQL/status/1263478563115859968',
    "Super excited about GraphQL Tools' overhaul! Amazing work @TheGuildDev 👏",
    ReardenQL,
  ),
  //
  SocialPost.fromTweet(
    'https://x.com/chimame_rt/status/1663577579557900289',
    '私が寄稿したブログが公開されました。ありがとう！The @TheGuildDev blog I contributed to is now available. Thank you! @UriGoldshtein https://the-guild.dev/blog/graphql-yoga-worker',
    ChimameRt,
  ),
];

function SocialPostCard({ post }: { post: SocialPost }) {
  const isDiscordLink = post.href.startsWith('https://discordapp.com/');
  const isGitHubLink = post.href.startsWith('https://github.com/');
  const isTwitterLink = post.href.startsWith('https://x.com/');

  return (
    <div className="relative h-max rounded-2xl bg-green-900 p-6 text-green-200">
      <div className="flex flex-row items-center gap-2">
        <div className="relative">
          <a
            className="absolute -left-1.5 -top-1.5 z-10 rounded-full border-2 border-transparent p-[5px] text-white hover:border-white"
            href={post.href}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              backgroundColor: isDiscordLink ? '#5865F2' : '#222530',
            }}
          >
            {isGitHubLink ? (
              <GitHubIcon className="size-[14px]" />
            ) : isDiscordLink ? (
              <DiscordIcon className="size-[14px]" />
            ) : isTwitterLink ? (
              <TwitterIcon className="size-[14px]" />
            ) : (
              <GlobeIcon className="size-[14px]" />
            )}
          </a>
          <Image
            src={post.avatar.toString()}
            alt={post.name}
            width={52}
            height={52}
            className="rounded-full opacity-85"
          />
        </div>
        <p className="text-sm">{post.name}</p>
      </div>
      <p className="mt-4 min-w-[220px] max-w-full">{post.text}</p>
    </div>
  );
}

function TheGraphCombomark() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="124"
      height="24"
      viewBox="0 0 124 24"
      fill="none"
    >
      <g clipPath="url(#clip0_1079_4499)">
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M1.19482 8.33735C1.19482 12.6549 4.93615 16.1637 9.52949 16.1637C14.1228 16.1637 17.8641 12.6549 17.8641 8.33735C17.8641 4.01975 14.1228 0.51088 9.52949 0.51088C4.93615 0.51088 1.19482 4.01975 1.19482 8.33735ZM3.97304 8.33735C3.97304 5.45895 6.46418 3.1197 9.52949 3.1197C12.5948 3.1197 15.0859 5.45895 15.0859 8.33735C15.0859 11.2157 12.5948 13.5549 9.52949 13.5549C6.46418 13.5549 3.97304 11.2157 3.97304 8.33735ZM17.4566 18.3899L11.9002 23.6076C11.6317 23.8641 11.2751 23.9902 10.9186 23.9902C10.562 23.9902 10.2101 23.8641 9.93693 23.6076C9.3952 23.0989 9.3952 22.2727 9.93693 21.764L15.4934 16.5464C16.0352 16.0377 16.9149 16.0377 17.4566 16.5464C17.9984 17.0551 17.9984 17.8813 17.4566 18.3899ZM17.5863 1.81529C17.5863 0.95438 18.3364 0.25 19.2532 0.25C20.1701 0.25 20.9202 0.95438 20.9202 1.81529C20.9202 2.6762 20.1701 3.38058 19.2532 3.38058C18.3364 3.38058 17.5863 2.6762 17.5863 1.81529ZM35.6193 7.2175V17.5911H32.7996V7.2175H29.1494V4.7148H39.3082V7.2175H35.6193ZM43.4606 13.166V17.5911H40.8146V3.98935H43.4606V9.557C43.9627 8.8316 44.967 8.3238 46.2224 8.3238C48.5593 8.3238 49.9498 9.91975 49.9498 12.2774V17.5911H47.3039V12.6945C47.3039 11.3887 46.7052 10.5907 45.6043 10.5907C44.3876 10.5907 43.4606 11.425 43.4606 13.166ZM61.7694 14.635C61.1901 16.4667 59.278 17.7906 56.8254 17.7906C53.8702 17.7906 51.7652 15.7957 51.7652 13.0391C51.7652 10.3369 53.9091 8.3238 56.8446 8.3238C59.6837 8.3238 62.0207 10.2281 61.8855 13.6376H54.3532C54.4693 14.7076 55.3191 15.6325 56.9607 15.6325C57.8877 15.6325 58.6987 15.2516 59.008 14.635H61.7694ZM54.4496 12.0054H58.9883C58.6603 10.7902 57.6753 10.3369 56.7674 10.3369C55.5507 10.3369 54.7009 11.0078 54.4496 12.0054ZM81.6624 9.88345C82.28 15.179 78.9777 17.8088 74.9027 17.8088C70.7117 17.8088 67.6793 14.8889 67.6793 11.153C67.6793 7.417 70.7117 4.49715 74.8638 4.49715C77.7418 4.49715 80.4068 6.0931 81.3339 8.5233H78.1279C77.4522 7.58025 76.1774 7.03615 74.8638 7.03615C72.2372 7.03615 70.4992 8.8497 70.4992 11.153C70.4992 13.4562 72.2372 15.2697 74.9027 15.2697C77.1236 15.2697 78.4564 14.1272 78.7652 12.3499H74.5742V9.88345H81.6624ZM86.2783 13.2567V17.5911H83.632V8.5233H86.2783V9.97415C86.6063 9.0855 87.5914 8.41445 88.6729 8.41445C88.9433 8.41445 89.233 8.4326 89.5615 8.5233V11.0442C89.1558 10.9172 88.7889 10.8447 88.364 10.8447C87.1085 10.8447 86.2783 11.7695 86.2783 13.2567ZM97.6151 16.5755C97.1902 17.1559 96.1668 17.7906 94.834 17.7906C92.2654 17.7906 90.2953 15.6325 90.2953 13.0572C90.2953 10.482 92.2654 8.3238 94.834 8.3238C96.1668 8.3238 97.1902 8.95855 97.6151 9.5389V8.5233H100.261V17.5911H97.6151V16.5755ZM92.9608 13.0572C92.9608 14.4718 93.9453 15.5237 95.3942 15.5237C96.8425 15.5237 97.8276 14.4718 97.8276 13.0572C97.8276 11.6426 96.8425 10.5907 95.3942 10.5907C93.9453 10.5907 92.9608 11.6426 92.9608 13.0572ZM105.475 16.5755V21.3815H102.83V8.5233H105.475V9.5389C105.92 8.95855 106.943 8.3238 108.276 8.3238C110.845 8.3238 112.814 10.482 112.814 13.0572C112.814 15.6325 110.845 17.7906 108.276 17.7906C106.943 17.7906 105.92 17.1559 105.475 16.5755ZM105.263 13.0572C105.263 14.4718 106.248 15.5237 107.697 15.5237C109.145 15.5237 110.13 14.4718 110.13 13.0572C110.13 11.6426 109.145 10.5907 107.697 10.5907C106.248 10.5907 105.263 11.6426 105.263 13.0572ZM117.392 13.166V17.5911H114.746V3.98935H117.392V9.557C117.894 8.8316 118.898 8.3238 120.154 8.3238C122.49 8.3238 123.881 9.91975 123.881 12.2774V17.5911H121.235V12.6945C121.235 11.3887 120.636 10.5907 119.536 10.5907C118.319 10.5907 117.392 11.425 117.392 13.166Z"
          fill="#CAE4DE"
        />
      </g>
      <defs>
        <clipPath id="clip0_1079_4499">
          <rect width="123" height="24" fill="white" transform="translate(0.928589)" />
        </clipPath>
      </defs>
    </svg>
  );
}

function ParseCombomark() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="67" height="24" viewBox="0 0 67 24" fill="none">
      <g clipPath="url(#clip0_1079_4501)">
        <path
          d="M65.6225 17.18V15.6C64.8544 16.02 64.0064 16.19 63.2782 16.19C61.7918 16.19 60.7643 15.44 60.6944 13.73H65.9717C66.0415 13.27 66.0615 12.79 66.0615 12.41C66.0615 10.5 64.9442 9.05 62.949 9.03C60.5149 9.01 58.9885 10.79 58.9885 13.53V13.57C58.9885 16.16 60.6545 17.69 63.1286 17.69C63.9566 17.68 64.8943 17.53 65.6225 17.18ZM62.8891 10.4C63.9566 10.4 64.4853 11.15 64.4853 12.31V12.4H60.8042C61.0436 11.1 61.7718 10.4 62.8891 10.4ZM54.8286 13.95L55.0081 14.02C56.2152 14.46 56.4946 14.72 56.4946 15.27C56.4946 15.91 56.0157 16.26 55.0081 16.26C54.2001 16.26 53.2524 16 52.2947 15.54V17.2C53.1027 17.51 54.0904 17.68 54.9383 17.68C57.0632 17.68 58.1506 16.67 58.1506 15.24C58.1506 13.99 57.562 13.22 55.8062 12.59L55.6266 12.52C54.2899 12.04 54.0305 11.77 54.0305 11.29C54.0305 10.76 54.4694 10.37 55.4271 10.37C56.1753 10.37 56.9335 10.63 57.7515 11.01V9.46C57.0532 9.2 56.305 9.02 55.477 9.02C53.6015 9.02 52.4244 10.05 52.4244 11.5C52.4244 12.66 53.013 13.29 54.8286 13.95ZM48.5238 11.87C49.0525 11.06 49.8107 10.62 50.7384 10.62C51.0477 10.62 51.3969 10.66 51.6562 10.75V9.26C51.3969 9.17 51.0676 9.11 50.7384 9.11C49.7708 9.11 49.0525 9.53 48.3941 10.38L48.3143 9.21H46.8877V17.52H48.5038V11.87H48.5238ZM43.9149 17.53H45.3415V11.93C45.3415 9.96 44.3538 9.01 42.2988 9.01C41.3112 9.01 40.2837 9.32 39.5155 9.73V11.33C40.4333 10.78 41.4209 10.45 42.209 10.45C43.3064 10.45 43.7453 10.93 43.7453 11.81V12.47C41.4907 12.56 40.134 12.93 39.4357 13.63C38.9369 14.11 38.6875 14.79 38.6875 15.47C38.6875 16.9 39.735 17.71 41.1615 17.71C42.0793 17.71 42.9971 17.34 43.8052 16.57L43.9149 17.53ZM41.5007 16.34C40.8024 16.34 40.3236 15.97 40.3236 15.35C40.3236 14.38 41.1316 13.84 43.7353 13.75V15.2C43.1268 15.88 42.3986 16.34 41.5007 16.34ZM32.2231 12.44V8.16H34.348C35.7945 8.16 36.6225 8.84 36.6225 10.27V10.29C36.6225 11.74 35.7945 12.42 34.348 12.42H32.2231V12.44ZM30.5172 17.53H32.2231V13.97H34.2183C36.7821 13.97 38.2885 12.61 38.2885 10.31V10.29C38.2885 8.01 36.7522 6.65 34.2183 6.65H30.5172V17.53ZM14.8949 14.92H9.0091C8.15117 14.92 7.65237 15.45 7.65237 16.21C7.65237 16.89 8.11126 17.37 8.76967 17.37C9.53782 17.37 9.97676 16.84 10.0167 16.08H11.7226C11.6328 17.94 10.4756 18.93 8.74972 18.93C7.13362 18.93 5.92653 17.83 5.92653 16.19C5.92653 14.48 7.19348 13.29 9.09888 13.29H14.9248C16.8901 13.29 18.3865 11.84 18.3865 9.89C18.3865 7.92 17.0497 6.53 15.1443 6.53C13.2588 6.53 11.7325 7.91 11.7325 10.46V12.13H10.0067V10.46C10.0067 7.08 12.1715 4.89 15.1742 4.89C18.0373 4.89 20.1223 6.95 20.1223 9.87C20.1422 12.79 17.9076 14.92 14.8949 14.92ZM12.8997 24C19.5936 24 24.8708 18.69 24.8708 12C24.8708 5.31 19.5936 0 12.8997 0C6.20586 0 0.928589 5.33 0.928589 12C0.928589 18.69 6.20586 24 12.8997 24Z"
          fill="#CAE4DE"
        />
      </g>
      <defs>
        <clipPath id="clip0_1079_4501">
          <rect width="65.1429" height="24" fill="white" transform="translate(0.928589)" />
        </clipPath>
      </defs>
    </svg>
  );
}

function SequenceCombomark() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="138"
      height="24"
      viewBox="0 0 138 24"
      fill="none"
    >
      <g clipPath="url(#clip0_1079_4517)">
        <path
          d="M40.4909 1.50977C43.8772 1.50977 46.0285 3.40489 46.1178 6.45748H43.1898C43.1198 5.00177 42.0908 4.14638 40.4443 4.14638C38.6386 4.14638 37.4697 5.02533 37.4697 6.43391C37.4697 7.63457 38.1104 8.30548 39.5046 8.63111L42.1374 9.20788C44.9955 9.83177 46.3935 11.3109 46.3935 13.8299C46.3935 16.9727 43.9665 19.0091 40.2851 19.0091C36.6037 19.0091 34.3826 17.0905 34.3126 14.0614H37.2406C37.2639 15.4935 38.4056 16.3489 40.2812 16.3489C42.1569 16.3489 43.4616 15.4936 43.4616 14.085C43.4616 12.951 42.8908 12.2801 41.5161 11.9818L38.8638 11.3816C36.0252 10.7577 34.5418 9.11766 34.5418 6.52806C34.5418 3.56962 36.9688 1.51369 40.4909 1.51369V1.50977Z"
          fill="#CAE4DE"
        />
        <path
          d="M47.9699 12.9982C47.9699 9.41589 50.2805 6.94019 53.5968 6.94019C56.9132 6.94019 59.1343 9.2276 59.1343 12.7903V13.6456L50.6222 13.6691C50.8281 15.682 51.8805 16.6981 53.7328 16.6981C55.2667 16.6981 56.2724 16.0978 56.5909 15.0111H59.1771C58.6956 17.5064 56.6375 19.0092 53.6862 19.0092C50.3233 19.0092 47.9661 16.5373 47.9661 12.9982H47.9699ZM50.6922 11.8643H56.3656C56.3656 10.2909 55.2899 9.25117 53.6201 9.25117C51.9503 9.25117 50.9679 10.1536 50.6922 11.8643Z"
          fill="#CAE4DE"
        />
        <path
          d="M66.0001 6.94411C67.7165 6.94411 69.2038 7.70524 69.8911 9.0236L70.0737 7.28939H72.6366V24H69.8678V17.1808C69.1572 18.3382 67.67 19.0053 66.0001 19.0053C62.6371 19.0053 60.715 16.4157 60.715 12.8569C60.715 9.29818 62.8197 6.94019 66.0001 6.94019V6.94411ZM66.6408 16.4667C68.5864 16.4667 69.8445 15.0581 69.8445 12.9982C69.8445 10.9383 68.5864 9.50622 66.6408 9.50622C64.6953 9.50622 63.5071 10.9618 63.5071 12.9982C63.5071 15.0346 64.6953 16.4667 66.6408 16.4667Z"
          fill="#CAE4DE"
        />
        <path
          d="M85.9952 7.28933V18.7071H83.409L83.2031 17.1808C82.5157 18.2677 81.0518 19.0053 79.5412 19.0053C76.9316 19.0053 75.4016 17.2239 75.4016 14.4264V7.2854H78.1937V13.4338C78.1937 15.6074 79.0402 16.4863 80.5974 16.4863C82.3605 16.4863 83.207 15.4466 83.207 13.2729V7.2854H85.9991L85.9952 7.28933Z"
          fill="#CAE4DE"
        />
        <path
          d="M87.9873 12.9982C87.9873 9.41589 90.2978 6.94019 93.6141 6.94019C96.9304 6.94019 99.152 9.2276 99.152 12.7903V13.6456L90.6395 13.6691C90.8453 15.682 91.8977 16.6981 93.75 16.6981C95.2839 16.6981 96.2896 16.0978 96.6081 15.0111H99.1949C98.7129 17.5064 96.6547 19.0092 93.7034 19.0092C90.3405 19.0092 87.9834 16.5373 87.9834 12.9982H87.9873ZM90.7094 11.8643H96.3829C96.3829 10.2909 95.3072 9.25117 93.6374 9.25117C91.9676 9.25117 90.9851 10.1536 90.7094 11.8643Z"
          fill="#CAE4DE"
        />
        <path
          d="M101.396 18.707V7.28936H103.983L104.212 8.76853C104.923 7.61107 106.293 6.94409 107.827 6.94409C110.665 6.94409 112.129 8.72533 112.129 11.6838V18.711H109.338V12.3547C109.338 10.4361 108.398 9.51013 106.957 9.51013C105.241 9.51013 104.188 10.7107 104.188 12.5627V18.711H101.396V18.707Z"
          fill="#CAE4DE"
        />
        <path
          d="M119.861 6.94411C122.949 6.94411 125.053 8.67833 125.352 11.4287H122.56C122.238 10.1339 121.302 9.46302 119.974 9.46302C118.188 9.46302 116.999 10.8284 116.999 12.9747C116.999 15.1209 118.099 16.4667 119.88 16.4667C121.275 16.4667 122.261 15.7722 122.557 14.5245H125.372C125.03 17.1847 122.831 19.0092 119.88 19.0092C116.448 19.0092 114.208 16.604 114.208 12.9747C114.208 9.34531 116.518 6.94019 119.857 6.94019L119.861 6.94411Z"
          fill="#CAE4DE"
        />
        <path
          d="M126.793 12.9982C126.793 9.41589 129.103 6.94019 132.419 6.94019C135.736 6.94019 137.957 9.2276 137.957 12.7903V13.6456L129.445 13.6691C129.651 15.682 130.704 16.6981 132.555 16.6981C134.09 16.6981 135.096 16.0978 135.414 15.0111H138C137.518 17.5064 135.461 19.0092 132.509 19.0092C129.146 19.0092 126.789 16.5373 126.789 12.9982H126.793ZM129.515 11.8643H135.189C135.189 10.2909 134.113 9.25117 132.443 9.25117C130.773 9.25117 129.791 10.1536 129.515 11.8643Z"
          fill="#CAE4DE"
        />
        <path
          d="M12.5158 4.21319C13.1216 3.27545 13.8129 2.49076 14.6594 1.84723C16.104 0.744643 17.7233 0.113007 19.5329 0.0345701C20.4959 -0.0086408 21.4629 0.0267154 22.4493 0.0267154V3.27152C22.0803 3.27152 21.7114 3.27152 21.3386 3.27152C20.4765 3.27937 19.6067 3.22439 18.7562 3.43636C16.9932 3.87577 15.7389 4.94301 14.9157 6.57523C15.8865 7.69341 17.0631 8.45857 18.5387 8.61937C19.4669 8.72137 20.4066 8.67828 21.3424 8.69399C21.7036 8.70185 22.0647 8.69399 22.4493 8.69399V11.9781C22.1774 11.9781 21.9211 11.9781 21.6609 11.9781C20.6434 11.9624 19.6261 11.9859 18.6125 11.9231C16.7486 11.8054 15.106 11.0952 13.6652 9.90632C13.5798 9.83574 13.4983 9.76908 13.3857 9.68268C12.7604 10.9422 12.1508 12.1742 11.5256 13.4376C12.4303 14.3283 13.3041 15.2582 14.2555 16.1018C15.3196 17.0435 16.6204 17.3965 18.0261 17.3927C19.3775 17.3888 20.7251 17.3927 22.0764 17.3927C22.1968 17.3927 22.4531 17.3927 22.4531 17.3927V20.6571C22.4531 20.6571 19.1329 20.6768 17.5796 20.6493C15.3079 20.61 13.3468 19.7703 11.6926 18.2127C11.1062 17.6594 10.5664 17.0552 10.0266 16.498C9.52179 17.0826 9.08688 17.6594 8.58203 18.1577C7.153 19.5624 5.4327 20.406 3.44059 20.5825C2.34938 20.6806 0.0271818 20.6532 0.0271818 20.6532V17.3927C0.0271818 17.3927 0.271829 17.3927 0.388324 17.3927C1.22323 17.3809 2.0659 17.424 2.89304 17.3495C4.98222 17.1689 6.50064 16.09 7.48305 14.2341C7.52194 14.1596 7.48692 13.9947 7.42869 13.932C6.24816 12.6647 4.81526 11.9702 3.07167 11.982C2.17464 11.9859 1.2776 11.982 0.380556 11.982C0.271829 11.982 0.0271818 11.982 0.0271818 11.982V8.70185C0.0271818 8.70185 2.70664 8.67436 3.9998 8.76065C5.86375 8.88228 7.49476 9.63174 8.91992 10.8441C8.96644 10.8833 9.01307 10.9226 9.07914 10.9736C9.1218 10.9108 10.4072 8.36825 10.9508 7.25006C10.9508 7.25006 10.9392 7.23828 10.8266 7.12057C10.0616 6.33981 9.3082 5.54726 8.51209 4.79781C7.40537 3.75021 6.06175 3.27937 4.55118 3.27545C3.16104 3.27152 1.77077 3.27545 0.380556 3.27545C0.271829 3.27545 0.13203 3.27545 0 3.27545V0.00315191C0 0.00315191 3.52214 -0.0164952 5.16089 0.0423157C7.35101 0.120861 9.2344 0.983988 10.8266 2.49468C11.3974 3.0361 11.9295 3.62072 12.5158 4.22105V4.21319Z"
          fill="#CAE4DE"
        />
      </g>
      <defs>
        <clipPath id="clip0_1079_4517">
          <rect width="138" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

function DaletCombomark() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="72" height="24" viewBox="0 0 72 24" fill="none">
      <g clipPath="url(#clip0_1079_4527)">
        <path
          d="M44.6088 17.5934C43.6324 19.0263 42.1719 19.7427 40.2274 19.7427C39.4188 19.7696 38.6141 19.6192 37.87 19.3024C37.126 18.9855 36.4606 18.5098 35.9209 17.9087C34.8327 16.6793 34.2541 15.0831 34.3023 13.444C34.2534 11.8035 34.8321 10.2058 35.9209 8.97511C36.4821 8.36536 37.1703 7.88556 37.9373 7.56943C38.7043 7.2533 39.5314 7.10851 40.3606 7.14523C41.1974 7.11049 42.0291 7.29204 42.7749 7.67227C43.5207 8.0525 44.1553 8.6185 44.6171 9.31536V7.34025H46.4563V19.5477H44.6171L44.6088 17.5934ZM40.4729 18.083C41.0654 18.1095 41.6562 17.9998 42.1994 17.7623C42.7427 17.5249 43.224 17.1661 43.606 16.7137C44.3619 15.7948 44.7541 14.6316 44.7087 13.444C44.754 12.2551 44.3618 11.0907 43.606 10.1701C43.2231 9.71893 42.7416 9.36127 42.1985 9.12462C41.6553 8.88796 41.065 8.77862 40.4729 8.80498C39.8743 8.78519 39.2787 8.89727 38.7285 9.13322C38.1784 9.36918 37.6871 9.72322 37.2898 10.1701C36.5077 11.0785 36.0976 12.2475 36.1414 13.444C36.0975 14.6392 36.5076 15.807 37.2898 16.7137C37.6864 17.1618 38.1774 17.5169 38.7277 17.7537C39.2779 17.9904 39.8739 18.1028 40.4729 18.083Z"
          fill="#CAE4DE"
        />
        <path d="M50.6547 19.5477H48.8197V2.73853H50.6547V19.5477Z" fill="#CAE4DE" />
        <path
          d="M59.2345 18.083C60.8822 18.083 62.0652 17.3984 62.7837 16.0291H64.7892C64.3911 17.1009 63.6902 18.0348 62.7712 18.7179C61.7276 19.4372 60.477 19.797 59.2095 19.7428C58.3709 19.7732 57.5354 19.6254 56.7585 19.3092C55.9816 18.993 55.281 18.5156 54.7032 17.9087C53.5704 16.7017 52.9631 15.0964 53.0139 13.444C52.9545 11.8026 53.5329 10.2017 54.6283 8.97514C55.8137 7.80296 57.4154 7.14526 59.0847 7.14526C60.754 7.14526 62.3557 7.80296 63.541 8.97514C64.638 10.2008 65.2165 11.8023 65.1554 13.444V14.1743H54.8988C54.9988 15.2336 55.4773 16.2217 56.2469 16.9585C56.6461 17.3329 57.1155 17.625 57.6282 17.818C58.1409 18.0109 58.6868 18.101 59.2345 18.083ZM59.0847 8.80501C58.0381 8.77505 57.0207 9.15142 56.2469 9.85481C55.5192 10.5413 55.0518 11.4574 54.9238 12.4482H63.2455C63.121 11.4525 62.655 10.5304 61.9265 9.83821C61.1485 9.14096 60.1302 8.77075 59.0847 8.80501Z"
          fill="#CAE4DE"
        />
        <path
          d="M67.3481 19.5477V2.73853H69.1831V7.34019H71.9834V8.95014H69.1665V19.5477H67.3481Z"
          fill="#CAE4DE"
        />
        <path
          d="M30.9487 17.614C29.9723 19.0442 28.5118 19.7607 26.5673 19.7634C25.7591 19.7899 24.9549 19.6398 24.2109 19.3238C23.467 19.0077 22.8014 18.5332 22.2608 17.9335C21.1734 16.702 20.595 15.1049 20.6422 13.4647C20.5941 11.8243 21.1727 10.2269 22.2608 8.99579C22.821 8.38714 23.5079 7.90799 24.2734 7.59189C25.0389 7.2758 25.8644 7.13042 26.6921 7.16591C27.5294 7.13121 28.3615 7.31322 29.1074 7.69422C29.8533 8.07523 30.4877 8.64227 30.9487 9.34019V1.74268H32.7878V19.585H30.9487V17.614ZM26.8128 18.1037C27.4074 18.1321 28.0006 18.0233 28.5461 17.7858C29.0917 17.5484 29.575 17.1885 29.9584 16.7344C30.7143 15.8155 31.1065 14.6523 31.061 13.4647C31.1073 12.2769 30.7149 11.1135 29.9584 10.195C29.5763 9.74252 29.0951 9.38373 28.5518 9.1463C28.0085 8.90888 27.4178 8.79917 26.8253 8.82566C26.2263 8.80581 25.6303 8.91827 25.08 9.15499C24.5297 9.39172 24.0387 9.74685 23.6422 10.195C22.8506 11.0977 22.4313 12.266 22.4688 13.4647C22.4249 14.6599 22.835 15.8277 23.6172 16.7344C24.0151 17.1841 24.5081 17.5403 25.0607 17.777C25.6133 18.0138 26.2117 18.1254 26.8128 18.1037Z"
          fill="#CAE4DE"
        />
        <path
          d="M11.9001 12.2033C11.9001 13.6473 11.2178 14.9917 10.0361 16.1286C12.7947 14.4315 14.5215 12 14.5215 9.3029C14.5215 4.14938 8.26352 0 0.549237 0H0V5.95851C6.61581 6.11203 11.9001 8.19087 11.9001 12.2033Z"
          fill="#CAE4DE"
        />
        <path
          d="M3.04578 19.0497V23.9999C9.18309 22.78 13.7309 17.8795 14.172 13.5103C12.595 16.4397 8.22608 18.5393 3.04578 19.0497Z"
          fill="#CAE4DE"
        />
      </g>
      <defs>
        <clipPath id="clip0_1079_4527">
          <rect width="72" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

function OutreachCombomark() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="130"
      height="24"
      viewBox="0 0 130 24"
      fill="none"
    >
      <g clipPath="url(#clip0_1079_4503)">
        <mask
          id="mask0_1079_4503"
          style={{
            maskType: 'luminance',
          }}
          maskUnits="userSpaceOnUse"
          x="0"
          y="0"
          width="130"
          height="24"
        >
          <path d="M129.379 0.00439453H0.619019V23.987H129.379V0.00439453Z" fill="white" />
        </mask>
        <g mask="url(#mask0_1079_4503)">
          <path
            d="M45.1076 7.38323C46.3055 8.02103 47.3064 8.96964 48.0035 10.1278C48.7067 11.2952 49.0701 12.6332 49.0532 13.9932C49.0701 15.3577 48.7069 16.7004 48.0035 17.873C47.3057 19.04 46.3058 20 45.1076 20.6535C43.8601 21.3232 42.4643 21.6739 41.046 21.6739C39.6277 21.6739 38.2319 21.3232 36.9844 20.6535C35.7862 20 34.7863 19.04 34.0885 17.873C33.3851 16.7004 33.0219 15.3577 33.0388 13.9932C33.0219 12.6332 33.3853 11.2952 34.0885 10.1278C34.7856 8.96964 35.7865 8.02103 36.9844 7.38323C38.236 6.72641 39.6303 6.38306 41.046 6.38306C42.4617 6.38306 43.856 6.72641 45.1076 7.38323ZM38.5411 9.60333C37.3654 10.2831 36.5098 11.3982 36.1623 12.7036C35.8148 14.0091 36.0037 15.3981 36.6877 16.5654C37.1359 17.3325 37.7771 17.971 38.5482 18.4191C39.3179 18.8695 40.1959 19.1053 41.0895 19.1016C41.9716 19.1053 42.838 18.8694 43.5944 18.4191C44.3602 17.9739 44.9926 17.3339 45.4261 16.5654C45.8761 15.7823 46.1085 14.8947 46.0995 13.9932C46.1088 13.0963 45.8763 12.2132 45.4261 11.4354C44.9895 10.6747 44.3575 10.0425 43.5942 9.60327C42.8312 9.16404 41.9643 8.93348 41.0822 8.93514C40.1906 8.93217 39.3142 9.16265 38.5411 9.60333Z"
            fill="#CAE4DE"
          />
          <path
            d="M70.0125 20.7537C69.1455 21.2965 68.1416 21.5855 67.1166 21.5871C66.2284 21.6214 65.3615 21.3123 64.6984 20.725C64.3682 20.392 64.1135 19.9928 63.9512 19.5542C63.7888 19.1155 63.7229 18.6475 63.7573 18.1817V7.40448L66.5229 7.07397V10.5298H69.7953V12.5488H66.5447V17.6715C66.5052 18.0683 66.6107 18.466 66.8414 18.7923C66.9596 18.906 67.1006 18.9937 67.2554 19.0495C67.4101 19.1051 67.575 19.1277 67.7392 19.1157C68.3169 19.0945 68.883 18.9473 69.3971 18.6845L70.0125 20.7537Z"
            fill="#CAE4DE"
          />
          <path
            d="M76.4559 10.5802C77.1664 10.1801 77.9702 9.97198 78.7871 9.97664V12.6566C78.2771 12.5923 77.7592 12.6318 77.265 12.7726C76.7709 12.9134 76.3108 13.1526 75.9129 13.4756C75.5618 13.7877 75.2848 14.1732 75.1021 14.6043C74.9192 15.0354 74.8352 15.5014 74.8559 15.9687V21.4578H72.0974V10.0629H74.8848V12.2183C75.2457 11.5385 75.7895 10.9714 76.4559 10.5802Z"
            fill="#CAE4DE"
          />
          <path
            d="M89.4369 11.5504C90.4254 12.7844 90.9181 14.3381 90.8196 15.9116C90.8196 16.278 90.8196 16.551 90.8196 16.7378H82.3345C82.4864 17.4832 82.89 18.1548 83.4784 18.6417C84.0932 19.1301 84.8634 19.3849 85.6504 19.3603C86.227 19.3632 86.7983 19.2507 87.3301 19.0297C87.8598 18.8176 88.3385 18.497 88.7346 18.0885L90.2333 19.6404C89.6505 20.2626 88.9392 20.7527 88.1481 21.0774C87.2787 21.4245 86.3487 21.598 85.4115 21.5876C84.3366 21.6104 83.273 21.3633 82.3201 20.869C81.4453 20.409 80.7255 19.7045 80.2496 18.843C79.7533 17.9172 79.504 16.8809 79.5255 15.8325C79.4972 14.7812 79.7467 13.7408 80.2496 12.8149C80.7255 11.9485 81.4415 11.2354 82.3129 10.7601C83.2402 10.267 84.28 10.0195 85.3318 10.0416C86.0855 9.98269 86.8429 10.0871 87.5516 10.3477C88.2605 10.6082 88.9038 11.0186 89.4369 11.5504ZM88.2712 14.8913C88.2748 14.5183 88.2022 14.1484 88.0578 13.8039C87.9134 13.4594 87.7004 13.1474 87.4315 12.8868C86.8482 12.4103 86.1162 12.1498 85.3608 12.1498C84.6055 12.1498 83.8734 12.4103 83.2902 12.8868C82.7186 13.4146 82.3564 14.1284 82.2694 14.8985L88.2712 14.8913Z"
            fill="#CAE4DE"
          />
          <path
            d="M104.322 10.0628V21.4578H101.534V19.6472C101.139 20.2559 100.59 20.7513 99.9417 21.0841C99.2463 21.431 98.4758 21.6037 97.6975 21.5871C96.6836 21.6189 95.6809 21.3703 94.8014 20.8687C93.9777 20.3759 93.3123 19.6607 92.883 18.8067C92.4141 17.8572 92.1808 16.8103 92.2024 15.7531C92.1812 14.7099 92.4147 13.677 92.883 12.7427C93.3161 11.9005 93.9813 11.1978 94.8014 10.7166C95.663 10.223 96.645 9.97438 97.6394 9.99814C98.419 9.98358 99.191 10.1535 99.8911 10.4939C100.545 10.8245 101.099 11.3201 101.498 11.9308V10.0628H104.322ZM100.528 18.4258C101.128 17.8342 101.486 17.0435 101.534 16.2058V15.4011C101.488 14.5608 101.129 13.7673 100.528 13.1738C100.231 12.8941 99.8811 12.6758 99.4982 12.5315C99.1154 12.3872 98.7076 12.3198 98.2984 12.3332C97.8621 12.3176 97.4278 12.3962 97.0253 12.5637C96.6227 12.7312 96.2616 12.9835 95.9671 13.3031C95.3449 13.9897 95.0131 14.8876 95.0404 15.8106C95.0151 16.7311 95.3467 17.6262 95.9671 18.311C96.2632 18.6281 96.6248 18.8784 97.0269 19.0445C97.4292 19.2106 97.8629 19.2888 98.2984 19.2737C98.7081 19.2861 99.1162 19.2176 99.4992 19.0721C99.8819 18.9266 100.232 18.7068 100.528 18.4258Z"
            fill="#CAE4DE"
          />
          <path
            d="M112.032 12.4197C111.609 12.4051 111.188 12.481 110.797 12.6422C110.406 12.8033 110.055 13.046 109.766 13.3537C109.171 14.0214 108.86 14.8917 108.897 15.7822C108.855 16.6842 109.166 17.5674 109.766 18.2466C110.052 18.5573 110.403 18.8021 110.795 18.9635C111.186 19.1248 111.609 19.199 112.032 19.1806C112.617 19.2223 113.203 19.1224 113.74 18.8897C114.278 18.6569 114.75 18.2982 115.116 17.8442L116.847 19.2811C116.336 20.0206 115.633 20.609 114.812 20.9839C113.903 21.3918 112.914 21.5955 111.917 21.5803C110.867 21.6008 109.83 21.3534 108.905 20.8619C108.041 20.3946 107.33 19.6916 106.856 18.8357C106.359 17.9101 106.11 16.8736 106.132 15.8253C106.105 14.7672 106.355 13.7202 106.856 12.7861C107.331 11.9238 108.045 11.2136 108.912 10.7385C109.844 10.2448 110.889 9.99733 111.945 10.02C112.905 10.004 113.857 10.1876 114.74 10.5588C115.529 10.8982 116.219 11.4295 116.745 12.1036L115.008 13.6555C114.63 13.2494 114.169 12.9288 113.656 12.7156C113.142 12.5023 112.589 12.4014 112.032 12.4197Z"
            fill="#CAE4DE"
          />
          <path
            d="M128.242 11.1552C128.636 11.5909 128.939 12.0996 129.134 12.652C129.329 13.2044 129.412 13.7896 129.379 14.374V21.4725H126.591V15.1643C126.609 14.8209 126.557 14.4774 126.439 14.1542C126.321 13.8309 126.139 13.5343 125.904 13.2819C125.66 13.0416 125.369 12.8538 125.049 12.7301C124.729 12.6065 124.386 12.5498 124.043 12.5634C123.635 12.5585 123.231 12.6392 122.857 12.8001C122.482 12.9611 122.146 13.1987 121.871 13.4974C121.315 14.1499 121.025 14.9857 121.06 15.8397V21.4294H118.273V5.68042H121.06V12.2545C121.842 10.76 123.232 10.0056 125.194 9.9769C125.756 9.95592 126.317 10.0497 126.841 10.2524C127.366 10.455 127.842 10.7623 128.242 11.1552Z"
            fill="#CAE4DE"
          />
          <path
            d="M58.617 10.063V16.5293C58.617 17.1905 58.3523 17.8246 57.8813 18.2922C57.4101 18.7597 56.7711 19.0223 56.1048 19.0223C55.4385 19.0223 54.7996 18.7597 54.3284 18.2922C53.8572 17.8246 53.5927 17.1905 53.5927 16.5293V10.063H50.8342V16.4574C50.8342 20.1791 53.4695 21.5586 56.1048 21.5586C58.7401 21.5586 61.3826 20.1719 61.3826 16.4503V10.063H58.617Z"
            fill="#CAE4DE"
          />
          <path
            d="M12.0723 0.00439453C8.04694 0.00439453 5.02072 1.01745 3.26144 2.75616C2.37829 3.63923 1.68789 4.69335 1.23325 5.85282C0.778616 7.01229 0.569492 8.25227 0.618913 9.49547C0.618913 13.6051 2.71122 18.0022 5.6361 20.9049C6.39627 21.6665 9.03156 23.9871 12.4849 23.9871C15.9383 23.9871 18.6388 21.8316 20.2894 20.2151C23.4822 17.0466 26.3708 11.5934 26.3708 8.00103C26.3857 6.49383 25.8032 5.04117 24.7491 3.95601C21.9763 1.20425 16.0107 0.00439453 12.0723 0.00439453ZM16.9519 14.2015C16.4668 14.7504 15.8734 15.195 15.2085 15.5076C14.5436 15.8202 13.8212 15.9943 13.0858 16.0192C11.8597 15.9944 10.6892 15.5062 9.81347 14.6541C8.81518 13.6682 8.23052 12.3435 8.17727 10.9468C8.16039 10.3643 8.26268 9.78453 8.47795 9.24241C8.69324 8.70029 9.01701 8.20712 9.42975 7.79267C9.9739 7.29341 10.6143 6.90871 11.3123 6.66173C12.0104 6.41478 12.7516 6.31068 13.4913 6.35573C14.2558 6.31269 15.0209 6.4285 15.7377 6.69573C16.4546 6.96295 17.1073 7.37573 17.6542 7.90763C17.9724 8.22434 18.2235 8.60114 18.3927 9.01577C18.5618 9.43039 18.6454 9.87446 18.6388 10.3217C18.5992 11.7819 17.9951 13.171 16.9519 14.2015Z"
            fill="#CAE4DE"
          />
        </g>
      </g>
      <defs>
        <clipPath id="clip0_1079_4503">
          <rect width="128.762" height="24" fill="white" transform="translate(0.619019)" />
        </clipPath>
      </defs>
    </svg>
  );
}
