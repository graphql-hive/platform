import { useEffect, useLayoutEffect } from 'react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export function useTheme() {
  useIsomorphicLayoutEffect(() => {
    // We add .light class to body to style the Headless UI
    // portal containing search results.
    document.body.classList.add('light');

    return () => {
      document.body.classList.remove('light');
    };
  }, []);
}
