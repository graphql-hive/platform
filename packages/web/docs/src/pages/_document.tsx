import { Head, Html, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    // We can drop it when Nextra is fixed
    // The html[lang] is not being added by Nextra
    <Html lang="en">
      <Head />
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
