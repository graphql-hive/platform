'use client';

import { CallToAction } from '@theguild/components';

export function ContactAnExpertButton() {
  return (
    <CallToAction
      variant="secondary"
      title="Contact our experts to learn more about GraphQL Federation"
      onClick={() => {
        (window as any).$crisp?.push(['do', 'chat:open']);
      }}
    >
      Contact an Expert
    </CallToAction>
  );
}
