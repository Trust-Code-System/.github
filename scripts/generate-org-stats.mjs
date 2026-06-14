import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const organization = process.env.GITHUB_ORG || "Trust-Code-System";
const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
const scriptDirectory = dirname(fileURLToPath(import.meta.url));
const outputPath = resolve(
  scriptDirectory,
  "..",
  "profile",
  "assets",
  "org-stats.svg",
);

const headers = {
  Accept: "application/vnd.github+json",
  "User-Agent": "trustcode-org-profile",
  "X-GitHub-Api-Version": "2022-11-28",
};

if (token) {
  headers.Authorization = `Bearer ${token}`;
}

async function github(path) {
  const response = await fetch(`https://api.github.com${path}`, { headers });

  if (!response.ok) {
    throw new Error(
      `GitHub API request failed (${response.status}): ${path}`,
    );
  }

  return response.json();
}

async function getRepositories() {
  const repositories = [];

  for (let page = 1; ; page += 1) {
    const batch = await github(
      `/orgs/${organization}/repos?type=public&per_page=100&page=${page}`,
    );
    repositories.push(...batch);

    if (batch.length < 100) {
      return repositories;
    }
  }
}

async function getLanguages(repositories) {
  const totals = new Map();

  await Promise.all(
    repositories
      .filter((repository) => !repository.archived)
      .map(async (repository) => {
        try {
          const languages = await github(
            `/repos/${organization}/${repository.name}/languages`,
          );

          for (const [language, bytes] of Object.entries(languages)) {
            totals.set(language, (totals.get(language) || 0) + bytes);
          }
        } catch (error) {
          console.warn(`Skipping languages for ${repository.name}: ${error.message}`);
        }
      }),
  );

  return [...totals.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 5);
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function formatNumber(value) {
  return new Intl.NumberFormat("en", { notation: "compact" }).format(value);
}

function truncate(value, length) {
  return value.length <= length ? value : `${value.slice(0, length - 1)}...`;
}

function metric(x, label, value, accent = false) {
  return `<g transform="translate(${x} 0)">
      <text class="metric-value${accent ? " accent" : ""}" x="0" y="108">${escapeXml(value)}</text>
      <text class="metric-label" x="0" y="132">${escapeXml(label)}</text>
    </g>`;
}

function renderLanguages(languages) {
  const palette = ["#155eef", "#7f56d9", "#12b76a", "#f79009", "#ef4444"];
  const total = languages.reduce((sum, [, bytes]) => sum + bytes, 0) || 1;
  let cursor = 0;
  const bars = [];
  const legend = [];

  languages.forEach(([language, bytes], index) => {
    const width = (bytes / total) * 380;
    const percentage = Math.round((bytes / total) * 100);
    bars.push(
      `<rect x="${cursor.toFixed(1)}" y="0" width="${Math.max(width, 2).toFixed(1)}" height="12" fill="${palette[index]}" />`,
    );
    legend.push(`<g transform="translate(${(index % 3) * 132} ${32 + Math.floor(index / 3) * 28})">
        <circle cx="5" cy="5" r="5" fill="${palette[index]}" />
        <text class="legend" x="17" y="10">${escapeXml(language)} ${percentage}%</text>
      </g>`);
    cursor += width;
  });

  return `<g transform="translate(470 190)">
      <text class="section-title" x="0" y="-22">Top languages</text>
      <clipPath id="language-bar"><rect x="0" y="0" width="380" height="12" rx="6" /></clipPath>
      <g clip-path="url(#language-bar)">${bars.join("")}</g>
      ${legend.join("")}
    </g>`;
}

const [org, repositories, openIssueSearch] = await Promise.all([
  github(`/orgs/${organization}`),
  getRepositories(),
  github(
    `/search/issues?q=${encodeURIComponent(`org:${organization} is:issue is:open`)}&per_page=1`,
  ),
]);

const activeRepositories = repositories.filter((repository) => !repository.archived);
const languages = await getLanguages(activeRepositories);
const stars = activeRepositories.reduce(
  (sum, repository) => sum + repository.stargazers_count,
  0,
);
const forks = activeRepositories.reduce(
  (sum, repository) => sum + repository.forks_count,
  0,
);
const openIssues = openIssueSearch.total_count;
const recentlyUpdated = [...activeRepositories]
  .sort((left, right) => new Date(right.pushed_at) - new Date(left.pushed_at))
  .slice(0, 3)
  .map((repository) => repository.name);
const generatedDate = new Intl.DateTimeFormat("en", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
}).format(new Date());

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="330" viewBox="0 0 900 330" role="img" aria-labelledby="title description">
  <title id="title">TrustCode System GitHub organization statistics</title>
  <desc id="description">${activeRepositories.length} public repositories, ${stars} stars, ${forks} forks, and ${openIssues} open issues.</desc>
  <style>
    .panel { fill: #ffffff; stroke: #d0d5dd; }
    .title { fill: #101828; font: 700 24px "Segoe UI", Arial, sans-serif; }
    .subtitle, .metric-label, .legend, .updated { fill: #667085; font: 500 13px "Segoe UI", Arial, sans-serif; }
    .metric-value { fill: #101828; font: 700 28px "Segoe UI", Arial, sans-serif; }
    .metric-value.accent, .section-title { fill: #155eef; }
    .section-title { font: 700 16px "Segoe UI", Arial, sans-serif; }
    .repo { fill: #344054; font: 600 14px "Segoe UI", Arial, sans-serif; }
    @media (prefers-color-scheme: dark) {
      .panel { fill: #0d1117; stroke: #30363d; }
      .title, .metric-value { fill: #f0f6fc; }
      .subtitle, .metric-label, .legend, .updated { fill: #8b949e; }
      .repo { fill: #c9d1d9; }
      .metric-value.accent, .section-title { fill: #58a6ff; }
    }
  </style>
  <rect class="panel" x="1" y="1" width="898" height="328" rx="14" />
  <text class="title" x="42" y="48">${escapeXml(org.name || organization)}</text>
  <text class="subtitle" x="42" y="72">Live public organization snapshot</text>
  <text class="updated" x="858" y="48" text-anchor="end">Updated ${escapeXml(generatedDate)}</text>
  ${metric(42, "Public repositories", formatNumber(activeRepositories.length), true)}
  ${metric(170, "Stars earned", formatNumber(stars))}
  ${metric(290, "Forks", formatNumber(forks))}
  ${metric(390, "Open issues", formatNumber(openIssues))}
  <line x1="42" y1="158" x2="858" y2="158" stroke="#d0d5dd" stroke-opacity=".65" />
  <g transform="translate(42 190)">
    <text class="section-title" x="0" y="-22">Recently updated</text>
    ${recentlyUpdated
      .map(
        (repository, index) =>
          `<text class="repo" x="0" y="${index * 29 + 8}">${index + 1}. ${escapeXml(truncate(repository, 42))}</text>`,
      )
      .join("")}
  </g>
  ${renderLanguages(languages)}
  <text class="updated" x="42" y="305">github.com/${escapeXml(organization)}</text>
</svg>`;

await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, svg, "utf8");
console.log(`Wrote ${outputPath}`);
