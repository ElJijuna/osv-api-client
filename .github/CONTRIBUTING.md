# Contributing

Thank you for your interest in contributing to `osv-api-client`!

## Development setup

```bash
git clone https://github.com/ElJijuna/osv-api-client.git
cd osv-api-client
npm install
```

## Running tests

```bash
npm test
npm run test:coverage
```

## Commit messages

This project uses [Conventional Commits](https://www.conventionalcommits.org/) to automate releases via `semantic-release`.

| Prefix | What it does |
|--------|-------------|
| `feat:` | New feature → minor release |
| `fix:` | Bug fix → patch release |
| `docs:` | Documentation only |
| `chore:` | Maintenance, no release |
| `BREAKING CHANGE:` | Major release |

## Adding new endpoints

1. Add the domain type in `src/domain/`
2. Implement the method on the appropriate resource in `src/resources/`
3. Export any new public types from `src/index.ts`
4. Add a test next to the modified file (e.g. `src/resources/MyResource.test.ts`)
5. Update `ROADMAP.md` (mark as ✅)

## Pull requests

- One feature or fix per PR
- All tests must pass (`npm test`)
- Follow the PR template
