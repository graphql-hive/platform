import { cn } from '@theguild/components';
import { FOUR_MAIN_PRODUCTS, SIX_HIGHLIGHTED_PRODUCTS } from '@theguild/components/products';

export const PRODUCTS_MENU_LIST = Object.fromEntries(
  (
    ['The GraphQL Stack', ...FOUR_MAIN_PRODUCTS, 'Libraries', ...SIX_HIGHLIGHTED_PRODUCTS] as const
  ).map((item, i) => {
    if (typeof item === 'string') {
      return [
        i,
        {
          // bug: Nextra 4 doesn't allow separators in menus anymore
          href: '#',
          title: (
            <>
              {/* This is a one-off class. The margins and paddings of the parent list item are were large. */}
              {/* eslint-disable-next-line tailwindcss/no-custom-classname */}
              <style className="hive-label-separator">
                {
                  ':is(li,a):has(>.hive-label-separator) { margin: 0.75rem 0 0.25rem 0; padding: 0 }'
                }
              </style>
              <span className="ml-2 font-medium text-gray-500 dark:text-neutral-400">{item}</span>
            </>
          ),
        },
      ];
    }
    return [
      i,
      {
        href: item.href,
        title: (
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'flex translate-y-[0.25px]',
                i > 6 && 'rounded-sm bg-gray-500 text-white dark:bg-white/10',
              )}
            >
              <item.logo className="size-4 text-[8px]" />
            </div>
            {item.name}
          </div>
        ),
      },
    ];
  }),
);
