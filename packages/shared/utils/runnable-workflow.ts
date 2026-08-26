import { FormWorkflowStepBase } from '../types'

type MaybePlaceholderStep = Pick<FormWorkflowStepBase, 'isPlaceholder'>

/**
 * Whether the workflow exists but its first step has not been set up.
 *
 * Used by the admin builder, which is the one consumer that must still see the
 * empty slot so it can render it and let the admin fill it back in.
 */
export const isFirstStepPlaceholder = (
  workflow: MaybePlaceholderStep[] | undefined,
): boolean => !!workflow?.[0]?.isPlaceholder

/**
 * The workflow that will actually run, as opposed to the workflow as stored.
 *
 * A workflow whose first step is unset has no one to start it, so it does not
 * run at all: this returns an empty workflow, which everything downstream
 * already understands as "behave like an ordinary single-respondent form".
 * Steps 2 onwards are still stored, and start running again the moment step 1
 * is set up.
 *
 * Only position 1 is considered. A placeholder anywhere else cannot be produced
 * by the delete endpoint, and treating it as a stop signal would silently
 * disable a workflow for a reason no admin could see.
 *
 * Call this wherever the *live* form drives behaviour. In-flight submissions
 * read their own snapshot instead, and the snapshot is taken from the result of
 * this function, so a run started while step 1 was missing stays an ordinary
 * form for its whole life.
 */
export const getRunnableWorkflow = <T extends MaybePlaceholderStep>(
  workflow: T[] | undefined,
): T[] => (isFirstStepPlaceholder(workflow) ? [] : (workflow ?? []))
