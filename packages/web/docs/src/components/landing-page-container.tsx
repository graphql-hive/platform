import { ReactNode } from 'react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { cn, CookiesConsent } from '@theguild/components';
import { AddLightClassToBody } from '../lib';

/**
 * Adds styles, cookie consent banner and Radix Tooltip provider.
 */
export function LandingPageContainer(props: { children: ReactNode; className?: string }) {
  return (
    <Tooltip.Provider>
      <AddLightClassToBody />
      <style>
        {
          /* css */ `
          html {
            scroll-behavior: smooth;
          }
          body {
            background: #fff;
            --nextra-primary-hue: 191deg;
            --nextra-primary-saturation: 40%;
            --nextra-bg: 255, 255, 255;
          }
          .nextra-sidebar-footer {
            display: none;
          }
          #crisp-chatbox { z-index: 40 !important; }
        `
        }
      </style>
      <div className={cn('flex h-full flex-col', props.className)}>{props.children}</div>
      <CookiesConsent />
    </Tooltip.Provider>
  );
}
