import test from "node:test";
import assert from "node:assert/strict";
import {
  createRouteTable,
  resolveRoute,
  translationsFor,
  linkedRoute,
} from "../shared/cms.ts";
import {
  seedDocuments,
  envText,
  parseCliJson,
  projectSlug,
} from "../scripts/setup-lib.mjs";
const page = (id, language, slug, translationKey = id) => ({
  _id: id,
  title: id,
  language,
  slug,
  translationKey,
});
const fixture = (multi = false) => ({
  website: {
    _id: "website",
    title: "Test",
    defaultLanguage: "de",
    languages: [
      { id: "de", title: "Deutsch", home: { _ref: "home-de" } },
      ...(multi
        ? [{ id: "en", title: "English", home: { _ref: "home-en" } }]
        : []),
    ],
  },
  pages: [
    page("home-de", "de", "home", "home"),
    page("home-en", "en", "home", "home"),
    page("contact-de", "de", "kontakt", "contact"),
    page("contact-en", "en", "contact", "contact"),
  ],
});
test("one language has no prefix and explicit Home ignores its slug", () => {
  const table = createRouteTable(fixture(), true);
  assert.deepEqual(
    table.routes.map((r) => r.path),
    ["/", "/kontakt"],
  );
  assert.equal(resolveRoute(table, "/de/kontakt").redirect, "/kontakt");
  assert.equal(resolveRoute(table, "/kontakt/").redirect, "/kontakt");
  assert.equal(resolveRoute(table, "/missing").page, undefined);
});
test("multiple languages, root redirect, translated links and home switch", () => {
  const table = createRouteTable(fixture(true), true);
  assert.equal(resolveRoute(table, "/").redirect, "/de");
  assert.equal(resolveRoute(table, "/kontakt").redirect, "/de/kontakt");
  assert.equal(
    linkedRoute(table, { _ref: "contact-de" }, "en").path,
    "/en/contact",
  );
  assert.deepEqual(
    translationsFor(table, table.routes[0]).map((r) => r.path),
    ["/de", "/en"],
  );
});
test("single English uses root paths regardless of language name", () => {
  const data = fixture(true);
  data.website.languages.shift();
  data.website.defaultLanguage = "en";
  assert.deepEqual(
    createRouteTable(data, true).routes.map((r) => r.path),
    ["/", "/contact"],
  );
});
test("missing translations are omitted; draft-only page gets an immediate route", () => {
  const data = fixture(true);
  data.pages.pop();
  data.pages.push(page("drafts.new", "en", "new"));
  const table = createRouteTable(data);
  assert.equal(linkedRoute(table, { _ref: "contact-de" }, "en"), undefined);
  assert.equal(resolveRoute(table, "/en/new").page._id, "new");
});
test("conflicting paths, translation groups, reserved slugs and missing homes fail", () => {
  const duplicate = fixture();
  duplicate.pages.push(page("other", "de", "kontakt"));
  assert.throws(() => createRouteTable(duplicate), /Duplicate page path/);
  const translation = fixture();
  translation.pages.push(page("other", "de", "other", "contact"));
  assert.throws(() => createRouteTable(translation), /Duplicate translation/);
  for (const slug of [
    "api/test",
    "preview/test",
    "de/contact",
    "../bad",
    "/bad",
    "bad?x",
  ]) {
    const data = fixture();
    data.pages[2].slug = slug;
    assert.throws(() => createRouteTable(data), /Invalid or reserved/);
  }
  const missing = fixture();
  missing.pages.shift();
  assert.throws(() => createRouteTable(missing, true), /home page/);
});
test("explicit old URLs resolve directly, but collisions and unsafe paths fail", () => {
  const data = fixture();
  data.pages[2].previousPaths = ["/old"];
  assert.equal(createRouteTable(data).redirects["/old"], "/kontakt");
  data.pages[2].previousPaths = ["/"];
  assert.throws(() => createRouteTable(data), /conflicts/);
  data.pages[2].previousPaths = ["//outside.example"];
  assert.throws(() => createRouteTable(data), /Invalid previous/);
});
test("setup seed is immediately routable and config serializers preserve values", () => {
  const [home, website] = seedDocuments("Example", "de");
  assert.equal(
    createRouteTable(
      { website, pages: [{ ...home, slug: home.slug.current }] },
      true,
    ).routes[0].path,
    "/",
  );
  assert.equal(projectSlug("Böckli Häring"), "bockli-haring");
  assert.equal(envText({ NAME: 'a"b' }), 'NAME="a\\"b"\n');
  assert.deepEqual(parseCliJson('Created\n{"projectId":"abc"}'), {
    projectId: "abc",
  });
  assert.throws(
    () => parseCliJson("secret-value"),
    (error) => !error.message.includes("secret-value"),
  );
});

test("setup dry run is noninteractive and makes no local or remote changes", async () => {
  const { spawnSync } = await import("node:child_process");
  const result = spawnSync(
    process.execPath,
    [
      "scripts/setup.mjs",
      "--dry-run",
      "--name",
      "Example",
      "--language",
      "de",
      "--project-id",
      "",
      "--dataset",
      "production",
    ],
    { encoding: "utf8" },
  );
  assert.equal(result.status, 0, result.stderr);
  const plan = JSON.parse(result.stdout);
  assert.equal(plan.slug, "example");
  assert.equal(plan.projectId, "");
});
