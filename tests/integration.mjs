// Real Nuxt build/HTTP checks against a local Sanity protocol fixture; no account or remote writes.
import { spawn } from "node:child_process";
import { writeFile, readFile } from "node:fs/promises";
import { once } from "node:events";
import assert from "node:assert/strict";
import { startMockCms } from "./mock-cms.mjs";
const mode = process.argv[2] || "ssr";
const workspace = JSON.parse(
  await readFile("packages/app/package.json", "utf8"),
).name;
const mock = await startMockCms(mode === "static");
const env = {
  ...process.env,
  NUXT_PUBLIC_SANITY_PROJECT_ID: "fixture",
  NUXT_PUBLIC_SANITY_API_HOST: mock.url,
  NUXT_PUBLIC_SANITY_USE_PROJECT_HOSTNAME: "false",
  NUXT_PUBLIC_SANITY_DATASET: "production",
  NUXT_SANITY_PREVIEW: mode === "preview" ? "true" : "false",
  NUXT_SANITY_VISUAL_EDITING_TOKEN: "local-test-placeholder",
  NUXT_SANITY_VISUAL_EDITING_STUDIO_URL: "http://localhost:3333",
  NUXT_ENABLE_PWA: "false",
  NUXT_TELEMETRY_DISABLED: "1",
};
let app;
try {
  const build = spawn(
    "corepack",
    ["yarn", "workspace", workspace, mode === "static" ? "generate" : "build"],
    { env, stdio: ["ignore", "pipe", "pipe"] },
  );
  let output = "";
  build.stdout.on("data", (chunk) => (output += chunk));
  build.stderr.on("data", (chunk) => (output += chunk));
  const [code] = await once(build, "exit");
  await writeFile(`/tmp/template-${mode}-build.log`, output);
  assert.equal(
    code,
    0,
    `Build failed: /tmp/template-${mode}-build.log\n${output.slice(-5000)}`,
  );
  if (mode === "static") {
    for (const [path, text] of [
      ["de/index.html", "Willkommen"],
      ["en/contact/index.html", "Contact"],
    ]) {
      const html = await readFile(
        `packages/app/.output/public/${path}`,
        "utf8",
      );
      assert.ok(html.includes(text), path);
    }
    const sitemap = await readFile(
      "packages/app/.output/public/sitemap.xml",
      "utf8",
    );
    assert.ok(sitemap.includes("https://example.test/en/contact"));
    const redirectHtml = await readFile(
      "packages/app/.output/public/index.html",
      "utf8",
    );
    assert.ok(redirectHtml.includes("url=/de"));
    console.log("Static multilingual pages, redirect and sitemap passed.");
  } else {
    app = spawn(process.execPath, ["packages/app/.output/server/index.mjs"], {
      env: { ...env, PORT: "3198", HOST: "127.0.0.1" },
      stdio: ["ignore", "pipe", "pipe"],
    });
    let serverLog = "";
    app.stdout.on("data", (chunk) => (serverLog += chunk));
    app.stderr.on("data", (chunk) => (serverLog += chunk));
    const base = "http://127.0.0.1:3198";
    for (let attempt = 0; attempt < 100; attempt++) {
      try {
        await fetch(base);
        break;
      } catch {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }
    const home = await fetch(base);
    const html = await home.text();
    await writeFile("/tmp/template-home.html", html);
    assert.equal(home.status, 200, html.slice(0, 1500) + serverLog);
    assert.ok(
      html.includes("Willkommen") && html.includes("CMS-Inhalt funktioniert."),
    );
    assert.ok(html.includes('href="/kontakt"'));
    assert.ok(
      html.includes('<meta property="og:site_name" content="CMS Test">'),
    );
    assert.ok(
      html.includes('<meta property="og:url" content="https://example.test/">'),
    );
    assert.ok(html.includes("https://example.test/#website"));
    const missing = await fetch(base + "/missing");
    assert.equal(missing.status, 404);
    const redirect = await fetch(base + "/de/kontakt", { redirect: "manual" });
    assert.equal(redirect.status, 301);
    assert.equal(redirect.headers.get("location"), "/kontakt");
    assert.ok(
      !html.includes("local-test-placeholder"),
      "Private preview token must not reach HTML",
    );
    if (mode === "preview") {
      assert.ok((home.headers.get("x-robots-tag") || html).includes("noindex"));
      assert.equal((await fetch(base + "/preview/enable")).status, 401);
      assert.equal(
        (
          await fetch(base + "/_sanity/visual-editing/fetch", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ query: "*[]" }),
          })
        ).status,
        403,
      );
      assert.equal((await fetch(base + "/draft-only")).status, 404);
      const enable = await fetch(
        base +
          "/preview/enable?sanity-preview-secret=fixture-secret&sanity-preview-pathname=/draft-only",
        { redirect: "manual" },
      );
      assert.equal(enable.status, 307);
      const cookie = enable.headers.get("set-cookie")?.split(";")[0];
      assert.ok(cookie);
      const draft = await fetch(base + "/draft-only", { headers: { cookie } });
      const draftHtml = await draft.text();
      assert.equal(draft.status, 200, draftHtml.slice(0, 1000));
      assert.ok(draftHtml.includes("Draft preview works"));
      assert.ok(!draftHtml.includes("local-test-placeholder"));
      console.log(
        "Preview handshake, authenticated drafts, noindex and public token isolation passed.",
      );
    }
    mock.data.website.languages.push({
      id: "en",
      title: "English",
      home: { _ref: "home-en" },
    });
    const english = await fetch(base + "/en/contact");
    const englishHtml = await english.text();
    assert.equal(english.status, 200, englishHtml.slice(0, 1000));
    assert.ok(
      englishHtml.includes("Contact") &&
        englishHtml.includes('href="/de/kontakt"'),
    );
    const root = await fetch(base, { redirect: "manual" });
    assert.equal(root.status, 301);
    assert.equal(root.headers.get("location"), "/de");
    mock.data.pages.push({
      _id: "new",
      title: "New without rebuild",
      language: "en",
      slug: "new",
      content: [],
    });
    const fresh = await fetch(base + "/en/new");
    assert.equal(fresh.status, 200);
    assert.ok((await fresh.text()).includes("New without rebuild"));
    console.log(
      "SSR: Home, content, navigation, 404, redirects, CMS language change and new page without rebuild passed.",
    );
  }
} finally {
  app?.kill();
  mock.server.closeAllConnections();
  mock.server.close();
}
