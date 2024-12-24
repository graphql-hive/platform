# Hive CLI (Command Line Interface)

[Hive](https://the-guild.dev/graphql/hive) is a fully open-source schema registry, analytics,
metrics and gateway for [GraphQL federation](https://the-guild.dev/graphql/hive/federation) and
other GraphQL APIs.

---

A CLI util to manage and control your Hive.

[![Version](https://img.shields.io/npm/v/@graphql-hive/cli.svg)](https://npmjs.org/package/@graphql-hive/cli)

## Installation

### NodeJS

If you are running a JavaScript/NodeJS project, you can install Hive CLI from the `npm` registry:

```
pnpm install -D @graphql-hive/cli
yarn add -D @graphql-hive/cli
npm install -D @graphql-hive/cli
```

> We recommend installing Hive CLI as part of your project, under `devDependencies`, instead of
> using a global installation.

### Binary

If you are running a non-JavaScript project, you can download the prebuilt binary of Hive CLI using
the following command:

```bash
curl -sSL https://graphql-hive.com/install.sh | sh
```

## Commands

<!-- commands -->

- [`hive app:create FILE`](#hive-appcreate-file)
- [`hive app:publish`](#hive-apppublish)
- [`hive artifact:fetch`](#hive-artifactfetch)
- [`hive config:delete KEY`](#hive-configdelete-key)
- [`hive config:get KEY`](#hive-configget-key)
- [`hive config:reset`](#hive-configreset)
- [`hive config:set KEY VALUE`](#hive-configset-key-value)
- [`hive dev`](#hive-dev)
- [`hive help [COMMAND]`](#hive-help-command)
- [`hive introspect LOCATION`](#hive-introspect-location)
- [`hive operations:check FILE`](#hive-operationscheck-file)
- [`hive schema:check FILE`](#hive-schemacheck-file)
- [`hive schema:delete SERVICE`](#hive-schemadelete-service)
- [`hive schema:fetch ACTIONID`](#hive-schemafetch-actionid)
- [`hive schema:publish FILE`](#hive-schemapublish-file)
- [`hive update [CHANNEL]`](#hive-update-channel)
- [`hive whoami`](#hive-whoami)

## `hive app:create FILE`

create an app deployment

```
USAGE
  $ hive app:create FILE --name <value> --version <value> [--registry.endpoint <value>] [--registry.accessToken
    <value>]

ARGUMENTS
  FILE  Path to the persisted operations mapping.

FLAGS
  --name=<value>                  (required) app name
  --registry.accessToken=<value>  registry access token
  --registry.endpoint=<value>     registry endpoint
  --version=<value>               (required) app version

DESCRIPTION
  create an app deployment
```

_See code:
[dist/commands/app/create.js](https://github.com/graphql-hive/platform/blob/v0.37.0/dist/commands/app/create.js)_

## `hive app:publish`

publish an app deployment

```
USAGE
  $ hive app:publish --name <value> --version <value> [--registry.endpoint <value>] [--registry.accessToken
    <value>]

FLAGS
  --name=<value>                  (required) app name
  --registry.accessToken=<value>  registry access token
  --registry.endpoint=<value>     registry endpoint
  --version=<value>               (required) app version

DESCRIPTION
  publish an app deployment
```

_See code:
[dist/commands/app/publish.js](https://github.com/graphql-hive/platform/blob/v0.37.0/dist/commands/app/publish.js)_

## `hive artifact:fetch`

fetch artifacts from the CDN. Note that the path shown in UI already contains `artifact`.

```
USAGE
  $ hive artifact:fetch --artifact sdl|supergraph|metadata|services|sdl.graphql|sdl.graphqls [--cdn.endpoint
    <value>] [--cdn.accessToken <value>] [--outputFile <value>]

FLAGS
  --artifact=<option>        (required) artifact to fetch (Note: supergraph is only available for federation projects)
                             <options: sdl|supergraph|metadata|services|sdl.graphql|sdl.graphqls>
  --cdn.accessToken=<value>  CDN access token (alternatively set via env var `HIVE_CDN_ENDPOINT`)
  --cdn.endpoint=<value>     CDN endpoint (alternatively set via env var `HIVE_CDN_ACCESS_TOKEN`)
  --outputFile=<value>       whether to write to a file instead of stdout

DESCRIPTION
  fetch artifacts from the CDN
```

_See code:
[dist/commands/artifact/fetch.js](https://github.com/graphql-hive/platform/blob/main/packages/libraries/cli/src/commands/artifact/fetch.ts)_

## `hive config:delete KEY`

deletes specific cli configuration

```
USAGE
  $ hive config:delete KEY

ARGUMENTS
  KEY  config key

DESCRIPTION
  deletes specific cli configuration
```

_See code:
[dist/commands/config/delete.js](https://github.com/graphql-hive/platform/blob/v0.37.0/dist/commands/config/delete.js)_

## `hive config:get KEY`

prints specific cli configuration

```
USAGE
  $ hive config:get KEY

ARGUMENTS
  KEY  (registry|cdn) config key

DESCRIPTION
  prints specific cli configuration
```

_See code:
[dist/commands/config/get.js](https://github.com/graphql-hive/platform/blob/v0.37.0/dist/commands/config/get.js)_

## `hive config:reset`

resets local cli configuration

```
USAGE
  $ hive config:reset

DESCRIPTION
  resets local cli configuration
```

_See code:
[dist/commands/config/reset.js](https://github.com/graphql-hive/platform/blob/v0.37.0/dist/commands/config/reset.js)_

## `hive config:set KEY VALUE`

updates specific cli configuration

```
USAGE
  $ hive config:set KEY VALUE

ARGUMENTS
  KEY    (registry|cdn) config key
  VALUE  config value

DESCRIPTION
  updates specific cli configuration
```

_See code:
[dist/commands/config/set.js](https://github.com/graphql-hive/platform/blob/v0.37.0/dist/commands/config/set.js)_

## `hive dev`

Develop and compose Supergraph with service substitution

```
USAGE
  $ hive dev (--url <value> --service <value>) [--registry.endpoint <value>] [--registry <value>]
    [--registry.accessToken <value>] [--token <value>] [--schema <value> ] [--watch] [--watchInterval <value>] [--write
    <value>]

FLAGS
  --registry=<value>              registry address
  --registry.accessToken=<value>  registry access token
  --registry.endpoint=<value>     registry endpoint
  --schema=<filepath>...          Service sdl. If not provided, will be introspected from the service
  --service=<string>...           (required) Service name
  --token=<value>                 api token
  --url=<address>...              (required) Service url
  --watch                         Watch mode
  --watchInterval=<value>         [default: 1000] Watch interval in milliseconds
  --write=<value>                 [default: supergraph.graphql] Where to save the supergraph schema file

DESCRIPTION
  Develop and compose Supergraph with service substitution
  Only available for Federation projects.
  Work in Progress: Please note that this command is still under development and may undergo changes in future releases
```

_See code:
[dist/commands/dev.js](https://github.com/graphql-hive/platform/blob/v0.37.0/dist/commands/dev.js)_

## `hive help [COMMAND]`

Display help for hive.

```
USAGE
  $ hive help [COMMAND...] [-n]

ARGUMENTS
  COMMAND...  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for hive.
```

_See code:
[@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.0.22/src/commands/help.ts)_

## `hive introspect LOCATION`

introspects a GraphQL Schema

```
USAGE
  $ hive introspect LOCATION [--write <value>] [--header <value>]

ARGUMENTS
  LOCATION  GraphQL Schema location (URL or file path/glob)

FLAGS
  --header=<value>...  HTTP header to add to the introspection request (in key:value format)
  --write=<value>      Write to a file (possible extensions: .graphql, .gql, .gqls, .graphqls, .json)

DESCRIPTION
  introspects a GraphQL Schema
```

_See code:
[dist/commands/introspect.js](https://github.com/graphql-hive/platform/blob/v0.37.0/dist/commands/introspect.js)_

## `hive operations:check FILE`

checks operations against a published schema

```
USAGE
  $ hive operations:check FILE [--registry.endpoint <value>] [--registry <value>] [--registry.accessToken <value>]
    [--token <value>] [--require <value>] [--graphqlTag <value>] [--globalGraphqlTag <value>] [--apolloClient]

ARGUMENTS
  FILE  Glob pattern to find the operations

FLAGS
  --apolloClient
      Supports Apollo Client specific directives

  --globalGraphqlTag=<value>...
      Allows to use a global identifier instead of a module import. Similar to --graphqlTag.
      Examples:
      --globalGraphqlTag gql (Supports: export const meQuery = gql`{ me { id } }`)
      --globalGraphqlTag graphql (Supports: export const meQuery = graphql`{ me { id } }`)

  --graphqlTag=<value>...
      Identify template literals containing GraphQL queries in JavaScript/TypeScript code. Supports multiple values.
      Examples:
      --graphqlTag graphql-tag (Equivalent to: import gqlTagFunction from "graphql-tag")
      --graphqlTag graphql:react-relay (Equivalent to: import { graphql } from "react-relay")

  --registry=<value>
      registry address

  --registry.accessToken=<value>
      registry access token

  --registry.endpoint=<value>
      registry endpoint

  --require=<value>...
      [default: ] Loads specific require.extensions before running the command

  --token=<value>
      api token

DESCRIPTION
  checks operations against a published schema
```

_See code:
[dist/commands/operations/check.js](https://github.com/graphql-hive/platform/blob/v0.37.0/dist/commands/operations/check.js)_

## `hive schema:check FILE`

checks schema

```
USAGE
  $ hive schema:check FILE [--service <value>] [--registry.endpoint <value>] [--registry <value>]
    [--registry.accessToken <value>] [--token <value>] [--forceSafe] [--github] [--require <value>] [--author <value>]
    [--commit <value>] [--contextId <value>]

ARGUMENTS
  FILE  Path to the schema file(s)

FLAGS
  --author=<value>                Author of the change
  --commit=<value>                Associated commit sha
  --contextId=<value>             Context ID for grouping the schema check.
  --forceSafe                     mark the check as safe, breaking changes are expected
  --github                        Connect with GitHub Application
  --registry=<value>              registry address
  --registry.accessToken=<value>  registry access token
  --registry.endpoint=<value>     registry endpoint
  --require=<value>...            [default: ] Loads specific require.extensions before running the codegen and reading
                                  the configuration
  --service=<value>               service name (only for distributed schemas)
  --token=<value>                 api token

DESCRIPTION
  checks schema
```

_See code:
[dist/commands/schema/check.js](https://github.com/graphql-hive/platform/blob/v0.37.0/dist/commands/schema/check.js)_

## `hive schema:delete SERVICE`

deletes a schema

```
USAGE
  $ hive schema:delete SERVICE [--registry.endpoint <value>] [--registry <value>] [--registry.accessToken <value>]
    [--token <value>] [--dryRun] [--confirm]

ARGUMENTS
  SERVICE  name of the service

FLAGS
  --confirm                       Confirm deletion of the service
  --dryRun                        Does not delete the service, only reports what it would have done.
  --registry=<value>              registry address
  --registry.accessToken=<value>  registry access token
  --registry.endpoint=<value>     registry endpoint
  --token=<value>                 api token

DESCRIPTION
  deletes a schema
```

_See code:
[dist/commands/schema/delete.js](https://github.com/graphql-hive/platform/blob/v0.37.0/dist/commands/schema/delete.js)_

## `hive schema:fetch ACTIONID`

fetch schema or supergraph from the Hive API

```
USAGE
  $ hive schema:fetch ACTIONID [--registry <value>] [--token <value>] [--registry.endpoint <value>]
    [--registry.accessToken <value>] [--type <value>] [--write <value>] [--outputFile <value>]

ARGUMENTS
  ACTIONID  action id (e.g. commit sha)

FLAGS
  --outputFile=<value>            whether to write to a file instead of stdout
  --registry=<value>              registry address
  --registry.accessToken=<value>  registry access token
  --registry.endpoint=<value>     registry endpoint
  --token=<value>                 api token
  --type=<value>                  Type to fetch (possible types: sdl, supergraph)
  --write=<value>                 Write to a file (possible extensions: .graphql, .gql, .gqls, .graphqls)

DESCRIPTION
  fetch schema or supergraph from the Hive API
```

_See code:
[dist/commands/schema/fetch.js](https://github.com/graphql-hive/platform/blob/v0.37.0/dist/commands/schema/fetch.js)_

## `hive schema:publish FILE`

publishes schema

```
USAGE
  $ hive schema:publish FILE [--service <value>] [--url <value>] [--metadata <value>] [--registry.endpoint <value>]
    [--registry <value>] [--registry.accessToken <value>] [--token <value>] [--author <value>] [--commit <value>]
    [--github] [--force] [--experimental_acceptBreakingChanges] [--require <value>]

ARGUMENTS
  FILE  Path to the schema file(s)

FLAGS
  --author=<value>                      author of the change
  --commit=<value>                      associated commit sha
  --experimental_acceptBreakingChanges  (experimental) accept breaking changes and mark schema as valid (only if
                                        composable)
  --force                               force publish even on breaking changes
  --github                              Connect with GitHub Application
  --metadata=<value>                    additional metadata to attach to the GraphQL schema. This can be a string with a
                                        valid JSON, or a path to a file containing a valid JSON
  --registry=<value>                    registry address
  --registry.accessToken=<value>        registry access token
  --registry.endpoint=<value>           registry endpoint
  --require=<value>...                  [default: ] Loads specific require.extensions before running the codegen and
                                        reading the configuration
  --service=<value>                     service name (only for distributed schemas)
  --token=<value>                       api token
  --url=<value>                         service url (only for distributed schemas)

DESCRIPTION
  publishes schema
```

_See code:
[dist/commands/schema/publish.js](https://github.com/graphql-hive/platform/blob/v0.37.0/dist/commands/schema/publish.js)_

## `hive update [CHANNEL]`

update the hive CLI

```
USAGE
  $ hive update [CHANNEL] [-a] [--force] [-i | -v <value>]

FLAGS
  -a, --available        See available versions.
  -i, --interactive      Interactively select version to install. This is ignored if a channel is provided.
  -v, --version=<value>  Install a specific version.
      --force            Force a re-download of the requested version.

DESCRIPTION
  update the hive CLI

EXAMPLES
  Update to the stable channel:

    $ hive update stable

  Update to a specific version:

    $ hive update --version 1.0.0

  Interactively select version:

    $ hive update --interactive

  See available versions:

    $ hive update --available
```

_See code:
[@oclif/plugin-update](https://github.com/oclif/plugin-update/blob/v4.2.13/src/commands/update.ts)_

## `hive whoami`

shows information about the current token

```
USAGE
  $ hive whoami [--registry.endpoint <value>] [--registry <value>] [--registry.accessToken <value>] [--token
    <value>]

FLAGS
  --registry=<value>              registry address
  --registry.accessToken=<value>  registry access token
  --registry.endpoint=<value>     registry endpoint
  --token=<value>                 api token

DESCRIPTION
  shows information about the current token
```

_See code:
[dist/commands/whoami.js](https://github.com/graphql-hive/platform/blob/v0.37.0/dist/commands/whoami.js)_

<!-- commandsstop -->

## Configuration

### Environment Variables

You may set the `HIVE_TOKEN` environment variable while running the Hive CLI, in order to set it
globally.

### Config file (`hive.json`)

You can create a `hive.json` file to manage your Hive configuration.

Note that the CLI args will override the values in config if both are specified.

The configuration input priority is: CLI args > environment variables > hive.json configuration.

This is how the structure of the config file should look like:

```json
{
  "registry": {
    "endpoint": "<yourRegistryURL>",
    "accessToken": "<yourtoken>"
  },
  "cdn": {
    "endpoint": "<yourCdnURL>",
    "accessToken": "<yourtoken>"
  }
}
```
