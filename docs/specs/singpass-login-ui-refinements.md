# Singpass login UI refinements

Status: approved for implementation on 2026-11-14.
Base: codex/singpass-all-steps, created from origin/stg-alt at abdedc260.

## Pinned implementation decisions

1. Put Login first in the workflow step editor and select it when opening a step. Preserve saved login choices. No login required is the default only for new unauthenticated steps/forms. Update validation tab routing with the reorder.
2. Replace the toggle/provider interaction everywhere these login controls appear, including workflow step editors, workflow Settings cards and forms without workflows, with a three-option radio. Use “Does this step require login?” or “Does this form require login?” as appropriate. Options: “No login required”; “Singpass” with description “Log in using Singpass and use Myinfo fields.”; “Corppass” with description “Log in using Corppass and use Corppass fields.” Existing saved values, restrictions, feature flags and save behaviour remain unchanged.
3. The Singpass CTA says “Add an NRIC field”; the Corppass CTA says “Add an NRIC or UEN field”. Both open the existing provider field palette without automatically inserting a field.
4. Preserve existing login-switch logic, confirmations, cancellation, field removal/unassignment, save timing, disabled states and feature-flag rules. This is a UI change, not a data/schema change.
5. Investigate the Create-page Settings link as a reported behaviour issue. The current MyInfoPanel route names settings/singpass, but the user reports that an actual recent test did not land on the correct page. A route string alone does not establish correct behaviour.

6. Keep the existing top “Edit your full workflow” link. Add a second button below the last Settings workflow step: “Go to workflows to add a new step”, with the existing arrow link icon. It opens Workflow without automatically creating a step. Reuse guarded navigation so failed saves block the route change.
7. Change the e-service ID label to “Enter your organisation’s Corppass e-service ID”.
8. Preserve older Singpass-only forms' authentication behaviour. Do not silently convert stored SP authentication to MyInfo or grant additional access through the radio UI. Show Singpass selected with description “Log in using Singpass” for legacy SP forms; retain the Myinfo description for normal MyInfo forms.

## Scope

These are login UI and navigation refinements. Keep the send-back checkout separate. Reproduce the reported Settings deep-link problem and fix it if present; do not treat a correct-looking destination constant as verification.

## Checks for implementation

- Radio selection reflects saved authentication on existing forms.
- Cancel switch/removal confirmation restores the previous choice.
- Existing save errors block guarded navigation.
- Login-first reorder preserves error navigation and later-step approvals.
- Verify the Settings deep link from the field palette through actual routing.
- Send-back work remains in its separate checkout.

## User refinements approved during local testing, 15 November

These supersede the earlier copy above:

- Settings tab and page title: “Login”. The existing route remains `settings/singpass`.
- Form question: “Select form login method”. Step question: “Does this step require a login?”
- Provider descriptions name “Singpass Myinfo fields” and “Corppass Myinfo fields”. Legacy SP keeps its login-only description.
- Both palette buttons: “Add an NRIC/FIN Field”, explicitly requested for both providers.
- Workflow summary heading: “Login”. Disabled summary: “No login enabled”.
- Tighten the gap after login choices; increase space before the Corppass service-ID label. Keep the user-reviewed spacing.
- Settings cards match workflow hover colours and transitions. Add a downward connector before the bottom workflow button; use a plain diagonal arrow on that button.
- Show server recipient-email validation beneath Specific emails with friendly copy and input focus, without duplicate toast/card errors.
