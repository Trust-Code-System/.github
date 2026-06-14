# Contributing to TrustCode repositories

Thank you for helping improve a TrustCode System project.

## Before you start

1. Read the target repository's README, local contribution guide, and
   architecture notes.
2. Search existing issues and pull requests before opening a duplicate.
3. Use an issue for material changes unless a maintainer has already approved
   the work.
4. Never commit secrets, production data, private client information, personal
   contact details, or unpublished vulnerability information.

## Development

TrustCode repositories use different stacks, including TypeScript, Python,
Next.js, FastAPI, AWS CDK, and security tooling. Follow the commands documented
in the target repository rather than assuming one package manager or test
runner.

Before opening a pull request:

- run the repository's formatter, linter, type checker, tests, and build;
- verify changed user flows at relevant desktop and mobile sizes;
- check accessibility and both supported color themes for visual work;
- update documentation and environment examples when behavior changes;
- confirm no generated files, logs, credentials, or local environment files
  were added accidentally.

## Pull requests

- Keep each pull request focused on one outcome.
- Explain the user, operational, or security problem being solved.
- Include screenshots or recordings for visual changes.
- Describe migrations, deployment steps, configuration changes, and rollback
  considerations.
- Link the relevant issue when one exists.
- Respond to review feedback with code or a clear technical explanation.

By contributing, you agree that your contribution may be used under the target
repository's applicable license and terms.
