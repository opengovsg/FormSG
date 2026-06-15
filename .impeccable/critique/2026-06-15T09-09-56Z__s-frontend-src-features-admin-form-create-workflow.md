---
target: workflow
total_score: 23
p0_count: 0
p1_count: 2
timestamp: 2026-06-15T09-09-56Z
slug: s-frontend-src-features-admin-form-create-workflow
---
## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 2 | No progress indicator in guided flow ("Step 2 of 3"). No save confirmation after editing a step. |
| 2 | Match Between System and Real World | 3 | Good plain-language guided messages. Minor: respondent type labels are system-oriented, not task-oriented. |
| 3 | User Control and Freedom | 2 | No "Back" in guided flow sections. Cancel discards changes silently. No undo after step deletion. |
| 4 | Consistency and Standards | 3 | Consistent Chakra components and 4px radius. Minor: StepNameBlock isRequired mismatch between FormLabel and FormControl. |
| 5 | Error Prevention | 3 | Good approval field cross-step validation. Gap: no unsaved changes warning on cancel. |
| 6 | Recognition Rather Than Recall | 2 | No cross-step field visibility. Respondent type radios have no descriptions or examples. |
| 7 | Flexibility and Efficiency | 1 | No keyboard shortcuts, no step reordering, no step duplication, no batch field assignment. |
| 8 | Aesthetic and Minimalist Design | 3 | Clean single-column layout, tonal layering, purposeful dividers. ConditionalRoutingOptionModal is dense. |
| 9 | Error Recovery | 2 | QuestionsBlock shows wrong error key (workflow_type instead of edit). No undo for step deletion. No form data persistence on refresh. |
| 10 | Help and Documentation | 2 | Guided messages provide contextual help. No inline help for respondent types or conditional routing. |
| **Total** | | **23/40** | **Acceptable** |

## Anti-Patterns Verdict

**LLM assessment**: Pass. No absolute-ban patterns found. No side-stripe borders, gradient text, glassmorphism, hero-metrics, identical card grids, or eyebrow kickers. Step numbering is functional (sequential workflow), not decorative. The FadeIn animation is subtle and purposeful. The interface reads as hand-built product UI, not AI-generated.

**Deterministic scan**: Zero findings. The detector's regex engine scanned all 52 files but found no matches. This is expected: FormSG uses Chakra UI prop-based styling, which the regex patterns don't match against. A browser-engine scan (computed styles on a live URL) would be needed for deeper detection. No dev server was running.

**Visual overlays**: Not performed (no dev server).

## Overall Impression

The guided workflow creation is genuinely well-designed. The progressive reveal with conversational transition messages is the best part of the UI. It matches the "Helpful Desk Officer" personality. The standard (non-guided) editing flow is functional but lacks the same warmth. The biggest opportunity: closing the gap between the guided experience and the edit experience so the whole workflow tab feels consistently friendly.

The three biggest problems: (1) a real bug in QuestionsBlock error display, (2) silent data loss on cancel, and (3) power users have almost no efficiency tools.

## What's Working

1. **Guided workflow creation is genuinely helpful.** The progressive reveal with transition messages ("This is the first step, so anyone with the form link can respond") reduces anxiety for first-time users. The auto-reveal for step 3+ is a smart efficiency shortcut that respects returning users' time.

2. **Error prevention on approval fields is thorough.** ApprovalsBlock validates three scenarios: no field selected, field already used in another step, and field deleted after being set. The `getValueIfNotDeleted` function handles an edge case that most implementations would miss.

3. **Step divider pattern communicates sequence clearly.** WorkflowStepBlockDivider uses vertical lines and filled chevron icons to visually connect steps. This reinforces the mental model of "form flows from person to person" better than plain stacked cards.

## Priority Issues

### [P1] QuestionsBlock shows wrong error message
**What**: `QuestionsBlock.tsx` line 93 renders `errors.workflow_type?.message` instead of `errors.edit?.message`. The `edit` field is the actual controlled field, but the error reads from the wrong key.
**Why it matters**: When a user fails to select questions, they see no error or an unrelated one. This is a functional bug that breaks error recovery.
**Fix**: Change line 93 to `{errors.edit?.message}`.
**Suggested command**: `/impeccable harden workflow`

### [P1] No unsaved changes warning on cancel
**What**: EditStepBlock and the guided flow discard all form state on cancel with no confirmation. Multi-selects with 10+ fields, typed emails, and approval settings vanish instantly.
**Why it matters**: Government officers configuring complex workflows can accidentally lose significant work. Violates "Respect the officer's time."
**Fix**: Add `formState.isDirty` check before `setToInactive`. If dirty, show a "Discard changes?" confirmation dialog.
**Suggested command**: `/impeccable harden workflow`

### [P2] No cross-step field visibility
**What**: When editing a step's QuestionsBlock, there's no indication whether a form field is already assigned to another step. Users must open each step individually to see assignments.
**Why it matters**: Workflows need each field assigned correctly. Without visibility, assignment errors surface only when respondents try to fill the form.
**Fix**: Add "Assigned to Step X" badges on multi-select items. Consider a summary view showing all field-to-step mappings.
**Suggested command**: `/impeccable shape workflow-field-matrix`

### [P2] Conditional routing requires leaving the application
**What**: Users must download a CSV template, edit it externally, and re-upload. The modal is a 2-step wizard with a carousel of instructions.
**Why it matters**: Violates "Respect the officer's time." The CSV round-trip is error-prone and breaks flow. This is the deepest emotional valley in the entire tab.
**Fix**: Replace with inline editable rows: "If [dropdown option] then [email]", auto-populated from the field's options. Keep CSV as import/export backup.
**Suggested command**: `/impeccable craft inline-routing-editor`

### [P3] Guided flow has no back navigation
**What**: Sections only reveal forward. The only reset on step 3+ is the "Guide me" icon which jumps back to section 1, not the previous section.
**Why it matters**: Users who realize a mistake in the previous section must complete the entire step and edit afterwards.
**Fix**: Add a "Back" button alongside "Continue" for sections 2+.
**Suggested command**: `/impeccable harden workflow`

## Persona Red Flags

**Jordan (First-Timer)**: The guided flow is excellent for Jordan. Two gaps: (1) After completing all steps, the shift from guided to normal WorkflowContent is abrupt with no success message. (2) The "Guide me" button on step 3+ is a small icon-only button (BiHelpCircle) in the top-right corner. Jordan may not notice it. No visible label.

**Sam (Accessibility-Dependent)**: (1) No skip links or landmark regions within the workflow tab. Step blocks lack `role="region"` or heading hierarchy within cards. (2) ConditionalRoutingOptionModal carousel images lack alt text verification and progress dots may not be keyboard-navigable. (3) FadeIn transitions cause a brief window where content exists in DOM but is not visually shown.

**Alex (Power User)**: (1) No keyboard shortcuts for add/save/cancel step. (2) No drag-and-drop step reordering. (3) No step duplication. Five similar steps means configuring from scratch five times. (4) No bulk field assignment. (5) Guided flow intro page cannot be permanently dismissed.

**Mei Ling (Non-technical Policy Officer)**: (1) Respondent type labels ("Specific email(s)", dynamic field reference) use system concepts. Mei Ling thinks "the supervisor" or "whoever handles that department." (2) "Which fields should this step fill?" assumes knowledge of "fields." She thinks "what information does this person provide?" (3) No visual overview of the complete workflow chain. She wants to see "Requester -> Supervisor -> HR" before diving into details.

## Minor Observations

1. `StepNameBlock.tsx` line 68: `isRequired` on FormLabel but `isRequired={false}` on FormControl shows a visual asterisk that doesn't match the actual requirement.
2. `WorkflowContent.tsx` line 37: Steps keyed by index (`key={i}`) instead of stable ID. React reconciliation issues if steps are reordered/deleted from middle.
3. `GuidedStep.tsx` line 117: `values.step_name = undefined as unknown as string` masks a type mismatch.
4. `WorkflowSkeleton.tsx`: Skeleton layout (8 equal bars) doesn't match actual workflow content shape.
5. `StatusTrackerToggle` in WorkflowContent sits in a separate card above steps. Its relationship to workflow configuration is unclear.

## Questions to Consider

1. **What if the guided flow was the only flow?** Editing an existing step could also use progressive reveal, just faster (all sections visible by default, collapsible). This would maintain emotional consistency without slowing power users.
2. **What if the workflow was visualized as a flowchart?** Government officers think in process diagrams. A simple flow diagram with editable nodes might match their mental model of "who sends it to whom" better than a vertical card stack.
3. **What if conditional routing used a visual decision tree instead of CSV upload?** Inline "If [option] then [email]" rows would eliminate the CSV round-trip and make routing logic visible in context.
