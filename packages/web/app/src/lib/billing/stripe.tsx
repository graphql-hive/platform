import { FC, ReactNode, Suspense, useState } from 'react';
import { env } from '@/env/frontend';
import { Elements as ElementsProvider } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import { getStripePublicKey } from './stripe-public-key';

export const HiveStripeWrapper: FC<{ children: ReactNode }> = ({ children }) => {
  // eslint-disable-next-line react/hook-use-state -- we don't need setter
  const [stripe] = useState<ReturnType<typeof loadStripe> | void>(() => {
    if (env.nodeEnv !== 'production') {
      return;
    }
    const stripePublicKey = getStripePublicKey();
    if (stripePublicKey) {
      return loadStripe(stripePublicKey);
    }
  });

  if (!stripe) {
    return children as any;
  }

  return (
    <Suspense fallback={children}>
      <ElementsProvider stripe={stripe}>{children}</ElementsProvider>
    </Suspense>
  );
};
