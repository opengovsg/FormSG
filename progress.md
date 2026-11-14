# Singpass login UI refinements

Scope: docs/specs/singpass-login-ui-refinements.md. Isolated from send-back work.

| Phase | Status | Evidence / next step |
|---|---|---|
| Decisions | Complete | Approved spec, including legacy SP preservation |
| Implementation | Complete | Radio choices, Login-first tabs, copy, workflow link and shared palette Settings link |
| Verification | Complete with limits | 6 focused test files, 34 passing tests; frontend TypeScript passed; source lint has no errors. Browser checked Corppass controls, Settings workflow button and Login-selected editor. Mocked-network warnings remain in composed-story tests. Reported Settings navigation bug did not reproduce; integration test reaches the Singpass panel. |
| Final review | Complete | Independent auth review found no blocking regressions. An initial Storybook review covered all five new stories and relevant page/control states; that server is no longer running. |

No production authentication, schema or stored-form migration changes. Feature changes are now split into focused local commits; nothing pushed.

## Review fixes, 15 November

- Complete: saved-SP option stability and reverse-path preservation in workflow and Settings saves. Explicit option-copy table; unsupported later-step SP confirmed excluded by schema, no backend schema changes.
- Complete: shared card hover tokens, disabled pencil hover guard, dead toggle/translation cleanup, translated Corppass service-ID label.
- Complete: named tab state and a single ordered list for headers, panels and error routing.
- Complete: reproducible `qs` dependency repair via pnpm packageExtensions; formatting/import cleanup.
- User-selected CTA wording and spacing retained intentionally. Local testing flag overrides remain enabled; remove/separate before a PR. No upstream PR integration performed.

Verification: 31 tests across the five requested regression files passed, plus 8 SP tests across four files. SP reverse-path tests first failed with MyInfo, then passed. Final frontend `pnpm exec tsc --noEmit`, Prettier and diff checks passed. Source lint: no errors after import correction; three existing fast-refresh warnings. Mocked-network warnings persist in composed-story tests. Independent final targeted review found no remaining blocker. No fresh visual review was performed in this fixes pass.

Evidence: `/tmp/singpass-review-fixes-suite.log`, `/tmp/singpass-legacy-red.log`, `/tmp/singpass-legacy-boundary.log`, `/tmp/singpass-settings-legacy.log`, `/tmp/singpass-fixes-types-final.log`, `/tmp/singpass-fixes-format.log`.

## Review commit sequence

Tooling/dependency repair → login choices and legacy compatibility → named workflow tabs → Settings navigation/shared card styling → palette route regression → inline recipient errors → updated spec and verification notes. Local-only GrowthBook overrides remain uncommitted in the frontend and backend.
