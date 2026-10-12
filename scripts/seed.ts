import { getCliClient } from "sanity/cli";
import { readFile } from "node:fs/promises";
import { seedDocuments } from "./setup-lib.mjs";

async function main() {
  const state = JSON.parse(
    await readFile(new URL("../.setup-state.json", import.meta.url), "utf8"),
  );
  const client = getCliClient({ apiVersion: "2025-02-19" }).withConfig({
    projectId: state.projectId,
    dataset: state.dataset,
    useCdn: false,
    perspective: "raw",
  });
  const datasets = await client.datasets.list();
  const dataset = datasets.find((value) => value.name === state.dataset);
  if (!dataset)
    await client.datasets.create(state.dataset, { aclMode: "public" });
  else if (dataset.aclMode !== "public")
    throw new Error(
      "This starter requires a public dataset. Existing private datasets are not modified.",
    );
  const existing = await client.fetch(
    'count(*[_type == "website" || _type == "page"])',
  );
  if (existing) {
    console.log("Existing CMS content retained; no seed documents written.");
    return;
  }
  const transaction = client.transaction();
  for (const document of seedDocuments(state.title, state.language))
    transaction.createIfNotExists(document);
  await transaction.commit();
  console.log("Home and Website created.");
}
main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
