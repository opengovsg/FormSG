/**
 * Constants relating to localStorage.
 */

/**
 * Key to store whether the admin is logged in in localStorage.
 */
export const LOGGED_IN_KEY = 'is-logged-in'

/**
 * Event name to be used when emitting event to indicate that localStorage has
 * been modified.
 */
export const LOCAL_STORAGE_EVENT = 'local-storage'

/**
 * Key to store whether a user has seen the rollout announcements before.
 */
export const ROLLOUT_ANNOUNCEMENT_KEY_PREFIX =
  'has-seen-rollout-announcement-20240404-'

/**
 * Key to store whether the admin has seen the feature tour in localStorage.
 */
export const FEATURE_TOUR_KEY_PREFIX = 'has-seen-feature-tour-'

/**
 * Key to store whether a user has seen the emergency contact number modal in localStorage.
 */
export const EMERGENCY_CONTACT_KEY_PREFIX = 'has-seen-emergency-contact'

/**
 * Key to store when was the last time user has seen the admin feedback modal
 */
export const ADMIN_FEEDBACK_HISTORY_PREFIX = 'last-seen-admin-feedback-'

/**
 * Key to store MRF secret key after load
 */
export const MULTIRESPONDENT_FORM_SUBMISSION_SECRET_KEY_PREFIX =
  'mrf-secret-key-'
