# PR body — feat(webhooks): show workflow-data callout on MRF webhook settings

## Problem

Admins can connect a webhook to an MRF form to send each submission to another tool in real time, but not every destination can do the same thing with it: only Plumber can use the multi-step workflow data across all steps — any other tool can only use the first step's data. Admins have no way to know this at the moment they configure a webhook, so they may wire up the wrong integration and be surprised when their tool can't act on later steps.

## Solution

Adds an always-on informational callout at the top of the webhook settings, above the endpoint URL field, telling admins that if workflows are enabled, only [Plumber](https://plumber.gov.sg/) can use data from all workflow steps while other tools can only use data from the first step, with a "Learn more" link to the simplified-modes FAQ. The callout is a neutral heads-up, not an error, and shows regardless of whether a workflow is configured yet or whether the entered URL is a Plumber link.

Visibility is gated on response mode alone: `SettingsWebhooksPage` computes `showWorkflowInfobox = responseMode === Multirespondent` and passes a single boolean into `WebhooksSection`. No feature flag is checked at this line — `enable-mrf-webhooks` is already guaranteed true on this code path by the page's existing `enableWebhooks` gate, and `mrf-cutover` governs form-creation defaults, a separate concern from webhook messaging.

**Alternatives considered**

- We considered having `WebhooksSection` (or the callout itself) read `useAdminFormSettings()` directly, like its siblings `WebhookUrlInput` and `RetryToggle` do. We kept the visibility decision at the page instead: the page already owns the settings query and the response-mode branching, so the section stays a dumb layout component with no data lookups of its own, and the callout stays a prop-less, non-fetching component that tests in isolation.
- An earlier draft (the `webhooks-workflow-callout` branch) gated the callout on `mrf-cutover` && MRF. We dropped the cutover flag: it couples the callout to the cutover rollout, while the capability distinction the copy describes is true regardless of cutover state.

**Screenshots**

Captured from the page stories in Storybook. The MRF "before" is unavailable via Storybook — the MRF story is introduced by this PR; on develop the same MRF form rendered the section without the callout, visually identical to the Storage row.

| Page | Before | After |
| --- | --- | --- |
| Settings → Webhooks (MRF form, `enable-mrf-webhooks` on) | unavailable — see note above | ![after MRF](https://raw.githubusercontent.com/yin-boop/FormSG/screenshots/.github/screenshots/webhooks-infobox/after-webhook-settings-mrf.png) |
| Settings → Webhooks (Storage form — unchanged) | ![before Storage](https://raw.githubusercontent.com/yin-boop/FormSG/screenshots/.github/screenshots/webhooks-infobox/before-webhook-settings-storage.png) | ![after Storage](https://raw.githubusercontent.com/yin-boop/FormSG/screenshots/.github/screenshots/webhooks-infobox/after-webhook-settings-storage.png) |

**Breaking Changes**

No - backwards compatible.

## Tests

**TC1: Callout shows on an MRF form**

- [ ] Enable the `enable-mrf-webhooks` GrowthBook flag for your admin
- [ ] Open Settings → Webhooks on a Multirespondent form
- [ ] An info (not error) callout appears above the Endpoint URL field
- [ ] "Plumber" opens https://plumber.gov.sg/ and "Learn more" opens https://go.gov.sg/formsg-guide-faq-simplified-modes

**TC2: Callout hidden on a Storage-mode form**

- [ ] Open Settings → Webhooks on a Storage-mode form — webhook settings render with no callout

**TC3: Callout is unconditional on workflow/URL**

- [ ] On the MRF form, confirm the callout shows before any workflow steps exist and does not change when a Plumber URL is entered
