'use client';

import { CallToAction } from '@theguild/components';

export const GetInTouchButton = () => {
  return (
    <CallToAction
      href="https://the-guild.dev/contact"
      variant="primary-inverted"
      className="mt-8"
      onClick={event => {
        if (window.$crisp) {
          event.preventDefault();
          window.$crisp?.push(['do', 'chat:open']);
        }
      }}
    >
      Get in touch
    </CallToAction>
  );
};
