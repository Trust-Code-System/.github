import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const applyChanges = process.argv.includes("--apply");
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const configPath = resolve(
  scriptDirectory,
  "..",
  "config",
  "repositories.json",
);
const config = JSON.parse(await readFile(configPath, "utf8"));
const organization = process.env.GITHUB_ORG || config.organization;

if (applyChanges && !token) {
  throw new Error("GH_TOKEN or GITHUB_TOKEN is required with --apply.");
}

const headers = {
  Accept: "application/vnd.github+json",
  "Content-Type": "application/json",
  "User-Agent": "trustcode-repository-metadata",
  "X-GitHub-Api-Version": "2022-11-28",
};

if (token) {
  headers.Authorization = `Bearer ${token}`;
}

async function github(path, options = {}) {
  const response = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      ...headers,
      ...options.headers,
    },
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `GitHub API request failed (${response.status}) for ${path}: ${body}`,
    );
  }

  return response.status === 204 ? null : response.json();
}

function sameTopics(left, right) {
  return [...left].sort().join("\n") === [...right].sort().join("\n");
}

for (const [name, desired] of Object.entries(config.repositories)) {
  const repositoryPath = `/repos/${organization}/${name}`;
  const [repository, topicResponse] = await Promise.all([
    github(repositoryPath),
    github(`${repositoryPath}/topics`),
  ]);
  const changes = {};

  if (repository.description !== desired.description) {
    changes.description = desired.description;
  }

  if ((repository.homepage || "") !== desired.homepage) {
    changes.homepage = desired.homepage;
  }

  const topicsChanged = !sameTopics(topicResponse.names, desired.topics);

  if (Object.keys(changes).length === 0 && !topicsChanged) {
    console.log(`${name}: current`);
    continue;
  }

  console.log(
    `${name}: ${applyChanges ? "applying" : "would apply"} ${[
      ...Object.keys(changes),
      ...(topicsChanged ? ["topics"] : []),
    ].join(", ")}`,
  );

  if (!applyChanges) {
    continue;
  }

  if (Object.keys(changes).length > 0) {
    await github(repositoryPath, {
      method: "PATCH",
      body: JSON.stringify(changes),
    });
  }

  if (topicsChanged) {
    await github(`${repositoryPath}/topics`, {
      method: "PUT",
      body: JSON.stringify({ names: desired.topics }),
    });
  }
}

console.log(applyChanges ? "Repository metadata updated." : "Dry run complete.");
