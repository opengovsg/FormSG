# Review findings — webhooks-workflow-infobox vs develop

Multi-axis review (`/review`) of the 3-commit diff adding the webhook workflow-data callout, its MRF-only gate, and the two-quadrant visibility tests. Each axis ran as an independent reviewer; Standards/Spec findings were verified against false positives by independent per-finding verifiers (cutoff 70).

## Standards

**Clean.** No documented-standard violations — i18n key placement and interpolation match `retry.description` exactly, tests follow the repo's `composeStories` pattern, and the story title prefix matches convention. The most borderline drop (scored 60 on independent verification, below cutoff):

- The callout takes a new, untagged dependency on `MRF_CUTOVER_FAQ_LINK`, a constant `WorkspacePage.tsx:53` explicitly plans to remove ("Remove this infobox (and MRF_CUTOVER_FAQ_LINK) once the cutover is complete"). The verifier confirmed the maintenance risk is real but the issue spec explicitly directs this link and acknowledges the constant's name is a misnomer while the linked content stays accurate. Cheap defusal if desired: rename the constant (e.g. `SIMPLIFIED_MODES_FAQ_LINK`) or amend the WorkspacePage TODO so cutover cleanup doesn't delete a constant this permanent callout still uses.

## Spec

**Clean.** All eight acceptance criteria verified met against the diff: placement above the endpoint URL field, gate is `responseMode === Multirespondent` only (no `mrf-cutover`, no `enableMrfWebhooks` re-check), character-exact copy sourced from the `workflowInfobox` i18n key, correct Plumber/FAQ hrefs, info variant, two-quadrant page tests, component copy/link tests, and an MRF page story. Two spec items confirmed moot due to spec staleness rather than diff defects:

- `MRF_CUTOVER_FAQ_LINK` already exists in `packages/shared/constants/links.ts` on develop, so no shared-package change was needed.
- `WebhookV1SchemaInfobox` no longer exists anywhere in the repo (removed on develop in `62ea89447`), so the "leave its gate untouched" criterion is satisfied vacuously.

One informational note dropped at 50 (below cutoff): converting the pre-existing `StorageModeMrfCutoverOn` story to the new `withGrowthBookFeatures` helper is a behaviour-preserving refactor the spec didn't request; the spec's out-of-scope list doesn't forbid it.

## Architecture / Divergent (merged — both axes flagged the same two lines)

1. **`showWorkflowInfobox` prop-drilling diverges from the section's own pattern** (`WebhooksSection.tsx:7`; also raised by Standards below threshold). Both siblings (`WebhookUrlInput`, `RetryToggle`) read `useAdminFormSettings()` themselves and React Query dedupes the fetch, so the section could derive the boolean locally, deleting the prop and the page-level computation; the story-based tests would pass unchanged. **Orchestrator note:** the issue spec and PRD explicitly mandate the current shape ("passes a single boolean into `WebhooksSection`, which keeps it a dumb layout component free of its own data lookups"), and a breadcrumb records it — so this finding re-litigates a spec decision. Acting on it is a spec change, not a fix.
2. **`withGrowthBookFeatures` helper deduped into the wrong home** (`SettingsWebhooksPage.stories.tsx:56`; flagged by Architecture, Divergent, and Standards). The identical GrowthBook decorator boilerplate exists in at least three other story files (`CreateFormModal`, `DuplicateFormModal`, `UseTemplateModal` stories), and shared story helpers already live in `src/utils/storybook.tsx`. Hoisting the new helper there costs the same as defining it locally and prevents a fifth copy; migrating the other three files can stay a follow-up.

All other choices were examined by the Divergent axis and confirmed optimal: always-on callout rather than workflow-presence detection, single i18n key with markdown links and URL interpolation, reuse of `InlineMessage variant="info" useMarkdown`, and `composeStories`-based tests.

## Summary

2 surviving findings (both Architecture+Divergent, cross-axis merged); Standards and Spec clean. Worst issue: the helper's placement (the one clearly actionable in-PR change), with the prop-drilling finding gated on whether the spec's structure decision should be revisited. 3 findings dropped below threshold (scores 60, 50, and two sub-threshold Standards duplicates of the judgement findings).
