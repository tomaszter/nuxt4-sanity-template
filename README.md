# Nuxt 4 + Sanity template

A simple monorepo featuring a Nuxt 4 app and a Sanity.io studio, serving as a clean starting point for new projects.

---

### Build Setup

Use Node 24.16.0 (`nvm use`) and the pinned Yarn 4.9.4 through Corepack.
Run workspace commands from the repository root. `corepack yarn` also works
when a globally installed Yarn 1 is present.

```bash
# install app & studio
$ corepack yarn install

# serve app at localhost:3000
# serve studio at localhost:3333
$ corepack yarn dev

# generate static project and launch app
$ cd ./packages/app
$ corepack yarn generate
$ corepack yarn serve

# deploy studio
$ cd ./packages/studio
$ corepack yarn deploy
```

### Validation

```bash
corepack yarn extract-types
corepack yarn typegen
corepack yarn typecheck
corepack yarn lint
corepack yarn build
```

Configure each workspace using its `.env.example` before connecting to your
Sanity project. The repository root `yarn.lock` is shared by both workspaces.
The app requires `NUXT_PUBLIC_SANITY_PROJECT_ID` to render and build. TypeGen
is configured in `packages/studio/sanity.cli.ts`; schema and generated types
are ignored by Git and recreated by the commands above.

### Upgrade notes

The template uses Nuxt 4.5, Sanity Studio 6 with React 19.2, and Tailwind CSS 4
through `@tailwindcss/vite`. Tailwind theme settings live in
`packages/app/app/assets/css/main.css`; keep its breakpoints in sync with
`packages/app/config/breakpoints.ts`. The empty color palette and custom
exponential easings are preserved from the original theme.
TypeScript stays on 5.9 for compatibility with the Vue type checker.

The placeholder `sanity-plugin-vercel-deploy` integration was removed because
its latest release only declares Sanity 3 support. Configure app deployment
in Vercel; Studio deployment remains available through `sanity deploy`.

---

### Studio

[https://test.sanity.studio](https://test.sanity.studio/)

---
