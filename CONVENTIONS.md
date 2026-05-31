# Engineering Conventions

## Stack Rationale

| Layer           | Choice                                      | Why                                                                                                                                                      |
| --------------- | ------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework       | Next.js 15 (App Router)                     | Battle-tested React meta-framework. Full-stack (API Routes + SSR/SSG). Best-in-class DX for web SaaS. Deployed anywhere (Vercel, containers, bare Node). |
| Language        | TypeScript                                  | Industry standard. Catches bugs at compile time. Enables confident refactoring.                                                                          |
| Package manager | pnpm                                        | Faster installs than npm/yarn, deterministic lockfile, disk-efficient.                                                                                   |
| Linting         | ESLint 9 (flat config) + eslint-config-next | Zero-config safety rules for React and Next.js.                                                                                                          |
| Formatting      | Prettier                                    | Eliminates style debates. Enforced in CI.                                                                                                                |
| Tests           | Vitest + @testing-library/react             | Faster than Jest. Native TypeScript support. Same API as Jest. jsdom environment for component tests.                                                    |
| CI              | GitHub Actions                              | Free, well-documented, integrates natively with GitHub.                                                                                                  |

Boring choices on purpose — optimize for onboarding speed and stability, not novelty.

## Branching

- `main` — always deployable. Protected; merges via PR only.
- Feature branches: `feat/<short-description>` (e.g. `feat/user-auth`)
- Bug branches: `fix/<short-description>` (e.g. `fix/login-redirect`)
- Delete branches after merge.

## Commit Format

Use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <short description>

[optional body]
```

Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `ci`.

Examples:

- `feat: add user authentication`
- `fix: correct token expiry calculation`
- `chore: bump next to 15.3.4`

One logical change per commit. Keep the subject line under 72 characters.

## Testing Bar

- **Minimum 80% line coverage** for production code.
- Write tests before implementation (TDD: Red → Green → Refactor).
- Test observable behavior, not implementation details.
- Mock only at system boundaries: network, DB, time, third-party APIs.
- Never mock your own modules.
- A test that can pass against broken behavior is wrong.
- File location: `src/__tests__/` for unit/component tests; `src/e2e/` for end-to-end (when added).

## File Organization

```
src/
  app/           # Next.js App Router pages and layouts
  components/    # Shared React components
  lib/           # Shared utilities, helpers, constants
  hooks/         # Custom React hooks
  types/         # TypeScript type definitions
  __tests__/     # Unit and component tests (mirrors src structure)
  test/          # Test setup and shared test utilities
```

Rules:

- **200–400 lines per file** typical; **800 lines maximum**.
- Organize by feature/domain, not by type, once the app grows.
- One default export per file for React components.
- Named exports for utilities and hooks.
- Keep files cohesive; extract when a file does more than one thing.

## Code Style

- No comments unless the `why` is non-obvious.
- Small pure functions preferred over large methods with side effects.
- Immutable patterns — return new values, don't mutate inputs.
- Validate at system boundaries (user input, external APIs); trust internal code.
- Handle errors explicitly; never silently swallow them.

---

## ADR — Shiplog v0: ingest → generate → render

### Data flow

```
User submits ?repo=owner/name via GET form
  → Next.js Server Component reads searchParams
  → fetchRecentPRs(owner, name)  [src/lib/github/ingest.ts]
      hits https://api.github.com/repos/{owner}/{name}/pulls?state=closed
      returns IngestResult (discriminated union: ok | error)
  → PlaceholderChangelogGenerator.generate(prs)  [src/lib/changelog/placeholder.ts]
      pure, deterministic, no I/O
      returns ChangelogEntry { technical: string[], customerFacing: string }
  → Server Component renders both sections as HTML
```

### Generation seam (`ChangelogGenerator` interface)

`src/lib/changelog/types.ts` defines:

```ts
interface ChangelogGenerator {
  generate(prs: PullRequest[]): Promise<ChangelogEntry>;
}
```

The `PlaceholderChangelogGenerator` is the only implementation in v0. It is
template/heuristic — no external calls. The seam is ready; a real LLM
implementation drops in without touching `ChangelogPage` or its callers.

### Deferred (not in v0)

| Feature | Why deferred |
|---|---|
| Real LLM generation | CEO owns API key provisioning; seam is wired |
| GitHub auth / private repos | Public repos only; no token needed |
| Persistence (DB) | No requirement in v0; add when storing history |
| User accounts / billing | Not in scope for first slice |
| Pagination beyond 20 PRs | Sufficient for demo; add when needed |

### Node.js 25 compatibility note

Node.js 25 exposes a non-functional `localStorage` global. Next.js 15.3.3 and
bundled `@typescript/vfs` call `localStorage.getItem()` at module load time,
which crashes. Fix: `polyfill-localstorage.cjs` in project root, loaded via
`NODE_OPTIONS='--require ./polyfill-localstorage.cjs'` in all package.json
scripts. Remove once Next.js ships a fix or the app pins an older Node.
