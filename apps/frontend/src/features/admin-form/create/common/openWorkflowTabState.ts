/**
 * Pass as router state when navigating to the create page to land on the
 * workflow tab instead of the default one.
 *
 * The sidebar context only exists on the create page, so a caller on another
 * page cannot open the tab directly. `OpenWorkflowTabOnArrival` reads this.
 */
export const OPEN_WORKFLOW_TAB_STATE = { openWorkflowTab: true } as const
