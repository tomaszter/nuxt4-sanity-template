export function projectSlug(name) {
  const slug = name
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  if (!slug || slug.length > 80)
    throw new Error(
      "Use a project name containing letters/numbers (max. 80 characters).",
    );
  return slug;
}
export function envText(values) {
  return (
    Object.entries(values)
      .map(([key, value]) => `${key}=${JSON.stringify(String(value))}`)
      .join("\n") + "\n"
  );
}
export function parseCliJson(output) {
  // CLI status messages can precede JSON. Never include captured output in errors (tokens).
  for (
    let index = output.indexOf("{");
    index >= 0;
    index = output.indexOf("{", index + 1)
  ) {
    try {
      return JSON.parse(output.slice(index));
    } catch {
      /* try next opening brace */
    }
  }
  throw new Error("Sanity CLI did not return valid JSON.");
}
export function seedDocuments(title, language) {
  const id = `home-${language}`;
  return [
    {
      _id: id,
      _type: "page",
      title: "Home",
      language,
      slug: { _type: "slug", current: "home" },
      translationKey: "home",
      content: [],
    },
    {
      _id: "website",
      _type: "website",
      title,
      defaultLanguage: language,
      languages: [
        {
          _key: language,
          _type: "language",
          id: language,
          title: new Intl.DisplayNames([language], { type: "language" }).of(
            language,
          ),
          home: { _type: "reference", _ref: id },
        },
      ],
      navigation: [
        {
          _key: "home",
          _type: "navigationLink",
          page: { _type: "reference", _ref: id },
        },
      ],
    },
  ];
}
