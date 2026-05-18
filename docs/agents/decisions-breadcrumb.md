# Breadcrumb Convention

During implementation, the agent drops **breadcrumbs** — small structured decision notes — into `.scratch/<feature>/decisions.md` in this repo. `prepare-for-review` reads them at PR time and surfaces each one either in the PR body (as a bullet under "Alternatives considered") or as an inline review comment anchored to a specific line.

Breadcrumbs exist so that rationale is captured at the moment of choice, not reconstructed after the fact. ADRs cover hard-to-reverse architectural decisions; breadcrumbs cover the smaller in-impl judgment calls where an ADR would be overkill but a reviewer would still benefit from knowing *why this and not that*.

## File layout

One file per feature: `.scratch/<feature>/decisions.md`. Append-only during the implementation loop. Each breadcrumb is a top-level `## decision:` section.

If the file does not exist when the implementation starts, the implementation skill creates it (with a one-line header) before appending the first entry. If no non-obvious decision is made during the whole loop, the file may remain absent — `prepare-for-review` will simply omit the "Alternatives considered" sub-section.

## Schema

```md
## decision: <kebab-case-slug>
**kind**: pr-body | inline
**file**: <path>             # required if kind=inline
**line**: <line-number>      # required if kind=inline
**why**: <one paragraph explaining the choice>
**alternatives**:            # optional
  - <option>: <why rejected>
  - <option>: <why rejected>
```

Field semantics:

- `kind: pr-body` — folded into the PR body's "Alternatives considered" sub-section under Solution. Use for design choices a reviewer can evaluate without staring at a specific line.
- `kind: inline` — posted as an inline PR review comment on `file:line`. Use when the *exact code at that location* is the surprising bit and the reviewer will want context right there.
- `why` — the load-bearing field. Be honest about the actual reason. If the reason was "this was the first thing that worked", say so.
- `alternatives` — only what was actually weighed. Fabricating plausible alternatives defeats the entire purpose.

## Example — kind: pr-body

```md
## decision: use-map-not-record-for-session-store
**kind**: pr-body
**why**: Session keys are constructed from untrusted user input, so `Map` is safer than a plain object — no risk of prototype pollution if a key happens to be `__proto__`. The slight readability cost is worth it for the security guarantee at a boundary.
**alternatives**:
  - Plain `Record<string, Session>`: rejected for the prototype-pollution reason above.
  - A wrapped class with explicit get/set: rejected as over-engineered for two call sites.
```

## Example — kind: inline

```md
## decision: token-expiry-uses-inclusive-comparison
**kind**: inline
**file**: src/auth/token.ts
**line**: 42
**why**: RFC 7519 §4.1.4 defines `exp` as a time *on or after which* the token must be rejected — meaning the token is valid up to and including the exact expiry second. The `<=` here is intentional; a strict `<` would expire tokens one second too early.
**alternatives**:
  - Strict `<`: rejected — would expire tokens one second early, breaking parity with libraries that follow the spec.
```

## What does not belong here

- Decisions that warrant an ADR (hard to reverse, architectural, surprising without context, real trade-off across genuine alternatives) — write the ADR, don't put it here.
- Mechanical or obvious choices ("used the existing helper", "matched the surrounding style") — adding these turns the file into noise and the reviewer learns to ignore it.
- Apologies or hedges ("I'm not sure if this is right but…") — if you're unsure, raise it as a question on the PR, not in a breadcrumb.
