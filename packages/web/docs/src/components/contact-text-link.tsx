'use client';

import { cn } from '@theguild/components';

// the errors are more readable if you add an interface for this
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface ContactTextLinkProps
  extends Omit<React.HTMLAttributes<HTMLAnchorElement>, 'href' | 'onClick'> {}

export function ContactTextLink(props: ContactTextLinkProps) {
  return (
    <a
      {...props}
      className={cn(
        'hive-focus -m-2 rounded p-2 font-medium hover:text-blue-700 hover:underline dark:hover:text-blue-100',
        props.className,
      )}
      href="https://the-guild.dev/contact"
      onClick={event => {
        if (window.$crisp) {
          window.$crisp.push(['do', 'chat:open']);
          event.preventDefault();
        }
      }}
    >
      {props.children || 'Contact Us'}
    </a>
  );
}

declare global {
  interface Window {
    $crisp?: {
      push(cmd: string[]): void;
    };
  }
}
