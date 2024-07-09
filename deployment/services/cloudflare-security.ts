import { readFileSync } from 'fs';
import { join } from 'path';
import * as cf from '@pulumi/cloudflare';
import * as pulumi from '@pulumi/pulumi';

const webAppPkgJsonFilepath = join(__dirname, '../../packages/web/app/package.json');
const webAppPkg = JSON.parse(readFileSync(webAppPkgJsonFilepath, 'utf8'));

const cfConfig = new pulumi.Config('cloudflareCustom');
const monacoEditorVersion = webAppPkg.devDependencies['monaco-editor'];

function toExpressionList(items: string[]): string {
  return items.map(v => `"${v}"`).join(' ');
}

export function deployCloudFlareSecurityTransform(options: {
  envName: string;
  ignoredPaths: string[];
  ignoredHosts: string[];
}) {
  // We deploy it only once, because CloudFlare is not super friendly for multiple deployments of "http_response_headers_transform" rules
  // The single rule, deployed to prod, covers all other envs, and infers the hostname dynamically.
  if (options.envName !== 'prod') {
    console.warn(
      `Skipped deploy security headers (see "cloudflare-security.ts") for env ${options.envName}`,
    );
    return;
  }

  const expression = `not http.request.uri.path in { ${toExpressionList(
    options.ignoredPaths,
  )} } and not http.host in { ${toExpressionList(options.ignoredHosts)} }`;

  const monacoCdnDynamicBasePath: `https://${string}/` = `https://cdn.jsdelivr.net/npm/monaco-editor@${monacoEditorVersion}/`;
  const monacoCdnStaticBasePath: `https://${string}/` = `https://cdn.jsdelivr.net/npm/monaco-editor@0.33.0/`;
  const paddleHost = 'paddle.com';
  const cspHosts = [paddleHost, `cdn.${paddleHost}`, '*.ingest.sentry.io'].join(' ');

  const contentSecurityPolicy = `
  default-src 'self';
  frame-src ${paddleHost};
  worker-src 'self' blob:;
  style-src 'self' 'unsafe-inline' ${paddleHost} fonts.googleapis.com rsms.me ${monacoCdnDynamicBasePath} ${monacoCdnStaticBasePath};
  script-src 'self' 'unsafe-eval' 'unsafe-inline' {DYNAMIC_HOST_PLACEHOLDER} ${monacoCdnDynamicBasePath} ${monacoCdnStaticBasePath} ${cspHosts};
  connect-src 'self' * {DYNAMIC_HOST_PLACEHOLDER} ${cspHosts}; 
  media-src ${paddleHost};
  style-src-elem 'self' 'unsafe-inline' ${monacoCdnDynamicBasePath} ${monacoCdnStaticBasePath} fonts.googleapis.com rsms.me ${paddleHost};
  font-src 'self' data: fonts.gstatic.com rsms.me ${monacoCdnDynamicBasePath} ${monacoCdnStaticBasePath} ${paddleHost};
  img-src * 'self' data: https: ${paddleHost};
`;

  const mergedCsp = contentSecurityPolicy.replace(/\s{2,}/g, ' ').trim();
  const splitted = mergedCsp
    .split('{DYNAMIC_HOST_PLACEHOLDER}')
    .map(v => `"${v}"`)
    .flatMap((v, index, array) => (array.length - 1 !== index ? [v, 'http.host'] : [v]));
  const cspExpression = `concat(${splitted.join(', ')})`;

  return new cf.Ruleset('cloudflare-security-transform', {
    zoneId: cfConfig.require('zoneId'),
    description: 'Enforce security headers and CSP',
    name: `Security Transform (all envs)`,
    kind: 'zone',
    phase: 'http_response_headers_transform',
    rules: [
      {
        expression,
        enabled: true,
        description: `Security Headers (all envs)`,
        action: 'rewrite',
        actionParameters: {
          headers: [
            {
              operation: 'remove',
              name: 'X-Powered-By',
            },
            {
              operation: 'set',
              name: 'Expect-CT',
              value: 'max-age=86400, enforce',
            },
            {
              operation: 'set',
              name: 'Content-Security-Policy',
              expression: cspExpression,
            },
            {
              operation: 'set',
              name: 'X-DNS-Prefetch-Control',
              value: 'on',
            },
            {
              operation: 'set',
              name: 'Strict-Transport-Security',
              value: 'max-age=31536000; includeSubDomains; preload',
            },
            {
              operation: 'set',
              name: 'X-XSS-Protection',
              value: '1; mode=block',
            },
            {
              operation: 'set',
              name: 'X-Frame-Options',
              value: 'DENY',
            },
            {
              operation: 'set',
              name: 'Referrer-Policy',
              value: 'strict-origin-when-cross-origin',
            },
            {
              operation: 'set',
              name: 'X-Content-Type-Options',
              value: 'nosniff',
            },
            {
              operation: 'set',
              name: 'Permissions-Policy',
              value:
                'accelerometer=(),autoplay=(),camera=(),clipboard-read=(),cross-origin-isolated=(),display-capture=(),document-domain=(),encrypted-media=(),fullscreen=(),gamepad=(),geolocation=(),gyroscope=(),hid=(),magnetometer=(),microphone=(),midi=(),payment=(),picture-in-picture=(),publickey-credentials-get=(),screen-wake-lock=(),sync-xhr=(),usb=(),window-placement=(),xr-spatial-tracking=()',
            },
          ],
        },
      },
    ],
  });
}
