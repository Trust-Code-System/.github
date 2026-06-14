# TrustCode System GitHub organization

This public `.github` repository controls the
[TrustCode System organization profile](https://github.com/Trust-Code-System)
and provides default community health files for repositories that do not define
their own.

## Public organization documentation

- [Capabilities](./CAPABILITIES.md): services, delivery model, and published proof.
- [Portfolio](./PORTFOLIO.md): documented products and engineering showcases.
- [Team](./TEAM.md): public founder profiles, credentials, and shipped outcomes.
- [Organization profile](./profile/README.md): the README rendered on the
  TrustCode GitHub overview.

## Shared standards

GitHub inherits the following files across TrustCode repositories when a
repository does not provide its own version:

- `CODE_OF_CONDUCT.md`
- `CONTRIBUTING.md`
- `SECURITY.md`
- `SUPPORT.md`
- `PULL_REQUEST_TEMPLATE.md`
- `.github/ISSUE_TEMPLATE/*`

Repository-specific instructions take precedence over these defaults.

## Organization statistics

The profile includes an SVG snapshot generated from GitHub's public API.

```powershell
$env:GH_TOKEN = gh auth token
node scripts/generate-org-stats.mjs
```

The `update-org-stats.yml` workflow checks the public API daily and prepares an
update branch when `profile/assets/org-stats.svg` changes.

## Repository metadata

Descriptions, homepages, and topics for public TrustCode repositories are
declared in `config/repositories.json`.

Preview drift:

```powershell
$env:GH_TOKEN = gh auth token
node scripts/apply-repository-metadata.mjs
```

Apply approved changes:

```powershell
$env:GH_TOKEN = gh auth token
node scripts/apply-repository-metadata.mjs --apply
```

## Updating public claims

Keep claims factual, conservative, and supported by approved team records,
published project evidence, or the
[TrustCode website](https://trustcodesystem.tech). Do not publish client
secrets, private contracts, personal phone numbers, personal email addresses,
credentials, or unpublished security findings.
