import { spawnSync } from "node:child_process";
const result = spawnSync("corepack", ["yarn", "exec", "nuxt", "generate"], {
  stdio: "inherit",
  env: {
    ...process.env,
    NUXT_BUILD_MODE: "static",
    NUXT_SANITY_PREVIEW: "false",
  },
});
process.exitCode = result.status ?? 1;
