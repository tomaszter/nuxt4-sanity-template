#!/usr/bin/env node
import { parseArgs } from "node:util";
import { spawnSync } from "node:child_process";
import { readFile, writeFile, access, chmod } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import { createInterface } from "node:readline/promises";
import { projectSlug, envText, parseCliJson } from "./setup-lib.mjs";
import { languagePattern } from "../shared/cms.ts";

const root = fileURLToPath(new URL("../", import.meta.url));
const studio = resolve(root, "packages/studio");
const appEnv = resolve(root, "packages/app/.env");
const studioEnv = resolve(studio, ".env");
const statePath = resolve(root, ".setup-state.json");
const { values: flags } = parseArgs({
  options: {
    "dry-run": { type: "boolean" },
    name: { type: "string" },
    language: { type: "string" },
    "project-id": { type: "string" },
    dataset: { type: "string" },
  },
});
const dryRun = flags["dry-run"];
const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = async (label, fallback = "") =>
  (await rl.question(`${label}${fallback ? ` [${fallback}]` : ""}: `)).trim() ||
  fallback;
async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}
function cli(args, capture = false) {
  const result = spawnSync("corepack", ["yarn", "exec", "sanity", ...args], {
    cwd: studio,
    encoding: "utf8",
    stdio: capture ? ["ignore", "pipe", "pipe"] : "inherit",
    env: { ...process.env, SANITY_CLI_NO_TELEMETRY: "1" },
  });
  if (result.status !== 0)
    throw new Error(
      `Sanity command failed (${args.slice(0, 2).join(" ")}). Check your login and project permissions, then rerun setup. Captured output is withheld to protect tokens.`,
    );
  return capture ? parseCliJson(result.stdout) : undefined;
}
try {
  let state = (await exists(statePath))
    ? JSON.parse(await readFile(statePath, "utf8"))
    : null;
  if (state?.complete && !dryRun) {
    console.log("Setup ist bereits abgeschlossen. Mit yarn dev starten.");
    rl.close();
    process.exit(0);
  }
  if (!state && ((await exists(appEnv)) || (await exists(studioEnv))))
    throw new Error(
      "Existing .env files found. Setup will not overwrite a configured project. Use a fresh template checkout.",
    );
  if (!state) {
    const title = flags.name ?? (await ask("Projektname"));
    const slug = projectSlug(title);
    const language =
      flags.language ?? (await ask("Hauptsprache (Sprachcode)", "de"));
    if (!languagePattern.test(language))
      throw new Error("Invalid language code; use de, en or fr-CH.");
    const projectId =
      flags["project-id"] ??
      (await ask("Bestehende Sanity-Projekt-ID (leer = neues Projekt)"));
    if (projectId && !/^[a-z0-9-]+$/.test(projectId))
      throw new Error("Invalid project ID.");
    const dataset = flags.dataset ?? (await ask("Dataset", "production"));
    if (!/^[a-z0-9][a-z0-9_-]{0,63}$/.test(dataset))
      throw new Error("Invalid dataset name.");
    state = { title, slug, language, projectId, dataset };
    if (dryRun) {
      console.log(
        JSON.stringify(
          {
            ...state,
            operations: [
              "Login/create or connect project",
              "Ensure public dataset",
              "Seed Home and Website without replacing content",
              "Configure localhost CORS",
              "Create private viewer token",
              "Rename workspaces and write .env files",
            ],
          },
          null,
          2,
        ),
      );
      process.exitCode = 0;
    } else {
      await writeFile(statePath, JSON.stringify(state), { mode: 0o600 });
    }
  }
  if (!dryRun) {
    cli(["login"]);
    if (!state.projectId) {
      const project = cli(
        [
          "projects",
          "create",
          state.title,
          "--dataset",
          state.dataset,
          "--dataset-visibility",
          "public",
          "--yes",
          "--json",
        ],
        true,
      );
      state.projectId = project.projectId;
      if (!state.projectId) throw new Error("No project ID returned.");
      await writeFile(statePath, JSON.stringify(state), { mode: 0o600 });
    }
    console.log(
      `Sanity-Projekt: ${state.projectId}. Bei einem Abbruch setzt yarn setup hier fort.`,
    );
    // Bootstrap CLI configuration before seeding; no credentials in Studio env.
    await writeFile(
      studioEnv,
      envText({
        SANITY_STUDIO_PROJECT_ID: state.projectId,
        SANITY_STUDIO_DATASET: state.dataset,
        SANITY_STUDIO_TITLE: state.title,
        SANITY_STUDIO_PREVIEW_URL: "http://localhost:3000",
        SANITY_STUDIO_STUDIO_HOST: state.slug,
      }),
      { mode: 0o600 },
    );
    cli(["exec", "../../scripts/seed.ts", "--with-user-token"]);
    for (const origin of ["http://localhost:3000", "http://localhost:3333"])
      cli([
        "cors",
        "add",
        origin,
        "--credentials",
        "--yes",
        "--project-id",
        state.projectId,
      ]);
    if (!(await exists(appEnv))) {
      const token = cli(
        [
          "tokens",
          "create",
          `${state.slug} local preview`,
          "--role",
          "viewer",
          "--yes",
          "--json",
          "--project-id",
          state.projectId,
        ],
        true,
      );
      if (!token.token) throw new Error("No preview token returned.");
      await writeFile(
        appEnv,
        envText({
          NUXT_PUBLIC_SANITY_PROJECT_ID: state.projectId,
          NUXT_PUBLIC_SANITY_DATASET: state.dataset,
          NUXT_PUBLIC_SANITY_API_VERSION: "2025-02-19",
          NUXT_SANITY_PREVIEW: "true",
          NUXT_SANITY_VISUAL_EDITING_STUDIO_URL: "http://localhost:3333",
          NUXT_SANITY_VISUAL_EDITING_TOKEN: token.token,
        }),
        { mode: 0o600 },
      );
      await chmod(appEnv, 0o600);
    }
    // Rewrite only workspace identities and script references, never dependency versions.
    const paths = [
      "package.json",
      "packages/app/package.json",
      "packages/studio/package.json",
    ];
    const manifests = await Promise.all(
      paths.map((path) =>
        readFile(resolve(root, path), "utf8").then(JSON.parse),
      ),
    );
    const names = [state.slug, `${state.slug}-app`, `${state.slug}-studio`];
    const replacements = manifests.map((manifest, index) => [
      manifest.name,
      names[index],
    ]);
    for (let index = 0; index < paths.length; index++) {
      const manifest = manifests[index];
      manifest.name = names[index];
      for (const [key, value] of Object.entries(manifest.scripts || {})) {
        manifest.scripts[key] = replacements.reduce(
          (text, [from, to]) =>
            text.replaceAll(`workspace ${from} `, `workspace ${to} `),
          value,
        );
      }
      await writeFile(
        resolve(root, paths[index]),
        JSON.stringify(manifest, null, 2) + "\n",
      );
    }
    const install = spawnSync("corepack", ["yarn", "install"], {
      cwd: root,
      stdio: "inherit",
    });
    if (install.status !== 0)
      throw new Error(
        "Workspace names updated. Run corepack yarn install, then yarn dev.",
      );
    state.complete = true;
    await writeFile(statePath, JSON.stringify(state), { mode: 0o600 });
    console.log(
      "Fertig. yarn dev startet Website :3000 und Studio :3333. Home ist bereits angelegt.",
    );
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
} finally {
  rl.close();
}
