/**
 * Router state the dashboard sets when an admin clicks into a form, so the
 * form page knows it was opened from the dashboard and not by a reload or a
 * link.
 */
export const OPENED_FROM_DASHBOARD_STATE = {
  openedFromDashboard: true,
} as const
