# Web App

SaaS starter built with Next.js 15, TypeScript, and pnpm.

## Prerequisites

- Node.js 20+
- pnpm 10+

## Setup

```bash
pnpm install
```

## Development

```bash
pnpm dev
```

Opens at [http://localhost:3000](http://localhost:3000).

## Lint & Format

```bash
pnpm lint          # ESLint
pnpm format        # Prettier (write)
pnpm format:check  # Prettier (check only)
```

## Tests

```bash
pnpm test          # Run once
pnpm test:watch    # Watch mode
```

## Build

```bash
pnpm build
pnpm start
```

## CI

GitHub Actions runs lint, format check, tests, and build on every push/PR to `main`.
See [`.github/workflows/ci.yml`](.github/workflows/ci.yml).

## Conventions

See [CONVENTIONS.md](CONVENTIONS.md) for stack rationale, branching, commit format, testing bar, and file organization.
