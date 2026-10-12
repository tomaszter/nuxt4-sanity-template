# Nuxt + Sanity starter

A CMS-driven starting point for new websites. Keep the dependency versions in this
repository; project setup changes names and configuration, not the package stack.

## Start a project

Use Node 24.16.0 (`nvm use`) and the project's pinned Yarn 4.18.1.
Enable Corepack once for your active Node installation, then check the Yarn version
from the repository root:

```sh
corepack enable
yarn --version # Expected: 4.18.1
```

If `yarn --version` already reports `4.18.1`, no additional setup is needed.
Use plain `yarn` for the commands below. If your shell still resolves a globally
installed Yarn 1, `corepack yarn <command>` explicitly uses the project's pinned
version until your PATH/Corepack setup is corrected.

Start the project:

```sh
yarn install
yarn setup
yarn dev
```

Setup asks for a name, main language, and either an existing Sanity project ID or a
new project. Dataset defaults to `production`. It opens Sanity login when needed,
creates/connects the project, ensures a **public dataset**, seeds a published Home
and Website, adds localhost CORS, and creates a **viewer-only preview token**.
The token is written only to the ignored app `.env`, never to Studio/public config.
Workspace names and the lockfile are updated automatically.

Existing `.env` files are not overwritten on a fresh setup. Interrupted setup can
be resumed using the ignored `.setup-state.json`; existing content is retained.
An existing private dataset is rejected without changing its visibility.
No project is created merely by installing or building the template.

Optional preview of setup actions, without login, writes or remote calls:

```sh
yarn setup --dry-run --name "Example" --language de --project-id "" --dataset production
```

Website: http://localhost:3000 · Studio: http://localhost:3333

## Work in Studio

- **Website:** name, domains, active languages, default language, Home references,
  navigation, global SEO and website icon.
- **Seiten:** title, language, URL slug, text/images, SEO and previous URLs.
- **Präsentation:** live draft preview and click-to-edit.

Create a page, choose a slug and language, and open its Presentation location.
The preview resolves new routes immediately, without restarting Nuxt. Publishing
makes the page available in an SSR deployment; a static production site needs its
next deployment. Add a page reference to Website → Navigation to show it in the menu.

### Languages and Home

One active language has no URL prefix: `/`, `/kontakt`. With two or more languages,
all URLs are prefixed: `/de`, `/de/kontakt`, `/en`, `/en/contact`. `/` redirects to
the default language's Home. A Home is explicitly assigned in Website → Languages;
its slug is ignored for its canonical URL.

To add a language:

1. Add its code and name to the Website draft. Do not publish it yet.
2. On Home, use **Übersetzung anlegen**, select that language, then translate and
   publish the new page. The action appears in the document action menu.
3. Assign that page as the new language's Home and publish Website.
4. Translate other pages through the same action, preserving their translation key.

The action copies content into a new draft; it does not machine-translate text.
Each translation group allows one page per language. Missing translations are
omitted from the language switch and translated navigation. Language selectors
read Website, including its draft; no language arrays need editing in code.

Switching between one and multiple languages automatically redirects the surviving
default language's previous URL form. When deleting a language or changing a slug,
add any other retired paths to the target page's **Frühere URLs**. There is no
persistent history of arbitrary language-code/slug changes. Do not rename live
language codes without adding those redirects.

## Deployment

Set the canonical **production domain in Studio** before generating a static site.
Builds reject missing published Homes, conflicting URLs and invalid language settings.

```sh
# Static production: disables all draft/preview integration even with a local preview .env
yarn workspace <project>-app generate

# SSR production: set NUXT_SANITY_PREVIEW=false in the deployment environment
yarn workspace <project>-app build

# Studio deployment (setup supplies a suggested hostname; adjust if already taken)
yarn workspace <project>-studio deploy
```

The Vercel build script selects SSR for the custom `sanity-preview` environment and
static generation otherwise. Configure `packages/app` as the Vercel root and allow
files outside that root so the shared routing module is included. Remove any hosting
catch-all rewrite to `404.html`; let Nuxt's output configure routing and redirects.
Other hosts can use the commands above and `.output/public` or `.output/server`.

For the hosted Studio preview:

- Deploy an SSR app with `NUXT_SANITY_PREVIEW=true`, a private viewer token and
  `NUXT_SANITY_VISUAL_EDITING_STUDIO_URL` pointing to the deployed Studio.
- Set Website → Preview-Domain to that app's origin.
- Add the actual Studio and app origins to Sanity CORS. Do not add a wildcard.
- Configure a hosting deploy hook and a Sanity publication webhook for static
  production. This is host-specific and is not created by local project setup.

Preview builds disable PWA and search indexing. PWA is opt-in for production via
`NUXT_ENABLE_PWA=true`. The default Website icon is served through Sanity's image
pipeline; generating a full platform-specific favicon set is a future extension.

## Architecture

- `shared/cms.ts`: common CMS contract, route resolution, translations and redirects.
- `packages/studio/src/schemaTypes`: starter schemas and publication validation.
- `packages/app/app/pages/[...path].vue`: live page resolution, navigation and SEO.
- `packages/app/modules/cms-routes.ts`: published routes and redirects for SSG.
- `packages/app/server/api/__sitemap__/urls.ts`: CMS sitemap source.
- `scripts/setup.mjs`: repeatable project bootstrap; no credentials in source control.

The implementation uses the installed `@nuxtjs/sanity` composables and Presentation
integration, rather than copies of private Nuxt internals. New content blocks can be
added to the page schema and `components/cms/Content.vue`. Add dedicated renderers
when a project needs multiple page types.

## Checks

```sh
yarn test
yarn extract-types
yarn typegen
yarn typecheck
yarn lint
yarn build
# Real Nuxt build and HTTP checks against a local mock CMS; no Sanity account needed:
node tests/integration.mjs ssr
node tests/integration.mjs static
node tests/integration.mjs preview
```

The integration checks require permission to open localhost ports and write their
build logs to the OS temp directory. They replace the local app build output.
The generic build/typecheck can use `NUXT_PUBLIC_SANITY_PROJECT_ID=unconfigured`
before setup. Schema extraction and TypeGen are local; generated files are ignored.

Dependency baseline: Nuxt 4.6.1, Sanity 6.18.0, Vue 3.5.43, React 19.3.0,
Vite 8.3.4, Tailwind CSS 4.3.3 and Yarn 4.18.1. Direct dependencies were
updated against the npm registry on 2026-10-13.

TypeScript is intentionally constrained to `~6.0.3`: Vue's type checker needs
the JavaScript compiler API that TypeScript 7 does not yet compatibly provide.
See the [TypeScript 7 release notes](https://devblogs.microsoft.com/typescript/announcing-typescript-7-0/).
Revisit this constraint when Vue's tooling supports the new compiler.

Commit `yarn.lock` and use `yarn install --immutable` in CI. Review updates
monthly, apply security fixes promptly, and validate major upgrades together
with their dependent modules using all checks above before tagging a release.
A real Sanity account setup and browser-based Studio editing should also be
smoke-tested before a production release; local integration tests use a mock CMS.
