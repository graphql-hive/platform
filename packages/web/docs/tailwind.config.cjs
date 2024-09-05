// @ts-check
/**
 * @type {typeof import("@theguild/tailwind-config").default}
 */
const config = /** @type {any} */ (require('@theguild/tailwind-config'));
const plugin = require('tailwindcss/plugin');
const { fontFamily } = require('tailwindcss/defaultTheme');

/**
 * @type {import("tailwindcss").Config}
 */
module.exports = {
  ...config,
  theme: {
    ...config.theme,
    extend: {
      ...config.theme.extend,
      fontFamily: {
        sans: ['var(--font-sans)', ...fontFamily.sans],
        display: ['var(--font-sans)', ...fontFamily.sans],
      },
      colors: {
        ...config.theme.extend.colors,
        primary: config.theme.extend.colors['hive-yellow'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: 0, opacity: 0 },
          to: { height: 'var(--radix-accordion-content-height)', opacity: 1 },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)', opacity: 1 },
          to: { height: 0, opacity: 0 },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.5s ease',
        'accordion-up': 'accordion-up 0.5s ease',
      },
    },
  },
  plugins: [
    require('tailwindcss-radix')({ variantPrefix: 'rdx' }),
    require('tailwindcss-animate'),
    plugin(({ addUtilities }) => {
      addUtilities({
        '.mask-image-none': {
          'mask-image': 'none',
        },
        '.blockquote': {
          position: 'relative',
          quotes: '"“" "”" "‘" "’"',
          '&:before, &:after': {
            position: 'absolute',
            lineHeight: '1',
            color: 'currentColor',
          },
          '&:before': {
            content: 'open-quote',
            top: '0',
            left: '0',
            transform: 'translate(-50%, -0.5rem)',
          },
          '&:after': {
            content: 'close-quote',
            bottom: '0',
            right: '0',
            transform: 'translate(50%, calc(50% + 0.25rem))',
          },
        },
      });
    }),
  ],
  darkMode: ['variant', '&:not(.light *)'],
};
