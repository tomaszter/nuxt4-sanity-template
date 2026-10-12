import { createServer } from "node:http";
export function fixture(multilingual = false) {
  const pages = [
    {
      _id: "home-de",
      _type: "page",
      title: "Willkommen",
      language: "de",
      slug: "home",
      translationKey: "home",
      content: [
        {
          _type: "block",
          _key: "intro",
          style: "normal",
          markDefs: [],
          children: [
            {
              _type: "span",
              _key: "span",
              text: "CMS-Inhalt funktioniert.",
              marks: [],
            },
          ],
        },
      ],
    },
    {
      _id: "contact-de",
      _type: "page",
      title: "Kontakt",
      language: "de",
      slug: "kontakt",
      translationKey: "contact",
      content: [],
    },
    {
      _id: "home-en",
      _type: "page",
      title: "Welcome",
      language: "en",
      slug: "home",
      translationKey: "home",
      content: [],
    },
    {
      _id: "contact-en",
      _type: "page",
      title: "Contact",
      language: "en",
      slug: "contact",
      translationKey: "contact",
      content: [],
    },
  ];
  return {
    website: {
      _id: "website",
      title: "CMS Test",
      productionUrl: "https://example.test",
      defaultLanguage: "de",
      languages: [
        { id: "de", title: "Deutsch", home: { _ref: "home-de" } },
        ...(multilingual
          ? [{ id: "en", title: "English", home: { _ref: "home-en" } }]
          : []),
      ],
      navigation: [{ _key: "contact", page: { _ref: "contact-de" } }],
    },
    pages,
  };
}
export async function startMockCms(multilingual = false) {
  const data = fixture(multilingual);
  const server = createServer(async (req, res) => {
    const url = new URL(req.url, "http://localhost");
    let query = url.searchParams.get("query") || "";
    let id = url.searchParams.get("$id");
    if (id) id = JSON.parse(id);
    if (req.method === "POST") {
      let body = "";
      for await (const chunk of req) body += chunk;
      const parsed = JSON.parse(body);
      query = parsed.query;
      id = parsed.params?.id;
    }
    const drafts =
      url.searchParams.get("perspective") === "drafts" &&
      req.headers.authorization === "Bearer local-test-placeholder";
    const draftPage = {
      _id: "preview-only",
      title: "Draft preview works",
      language: "de",
      slug: "draft-only",
      content: [],
    };
    const pages = drafts ? [...data.pages, draftPage] : data.pages;
    const secret = url.searchParams.get("$secret");
    const result = query.includes("sanity.previewUrlSecret")
      ? {
          private:
            secret === '"fixture-secret"'
              ? {
                  _id: "secret",
                  _updatedAt: new Date().toISOString(),
                  secret: "fixture-secret",
                  studioUrl: "http://localhost:3333",
                }
              : null,
          public: null,
        }
      : query.includes('"website"')
        ? { ...data, pages }
        : pages.find((page) => page._id === id) || null;
    res.setHeader("content-type", "application/json");
    res.end(JSON.stringify({ result, ms: 1, query }));
  });
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  return { data, server, url: `http://127.0.0.1:${server.address().port}` };
}
