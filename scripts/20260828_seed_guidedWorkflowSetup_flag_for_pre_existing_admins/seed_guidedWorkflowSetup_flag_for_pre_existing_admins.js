/* eslint-disable */

/** What: This script sets flags.guidedWorkflowSetup to 0 for every user account
 * created before the workflow builder redesign was deployed, where the flag
 * does not already exist.
 * Why: The flag's stored number carries a meaning rather than a version. Unset
 * means a new admin who has never been taught the workflow model, 0 means an
 * admin who predates the redesign, and 1 means taught. Admins who predate the
 * redesign may or may not have built a workflow before, and we cannot know
 * which, so they are offered a choice between guided setup and building
 * manually rather than having guidance imposed on them.
 *
 * WHEN TO RUN THIS: at code deploy, BEFORE the workflow-builder-redesign
 * feature flag is enabled for anyone. Not at full rollout. "Predates the
 * redesign" is a fact about the deploy, so the cohort boundary has to be drawn
 * there. Seeding at full rollout would leave the pilot cohort unseeded, and
 * they would get guidance imposed rather than offered.
 *
 * This is a one-shot. Accounts created after the deploy are never seeded, so
 * they fall to unset and are correctly treated as new. If this is missed at
 * release it cannot be corrected afterwards, because by then new admins are
 * also unset and the two cohorts are indistinguishable.
 *
 * No schema change. UserBase.flags is already a Mongo Schema.Types.Map keyed by
 * SeenFlags, so this is a data write against an existing field.
 */

// Replace with the actual deploy timestamp before running.
const DEPLOY_TIMESTAMP = ISODate("2026-01-01T00:00:00.000+00:00")

// COUNT # total number of users
db.users.countDocuments()

// STEP 1: set flags.guidedWorkflowSetup to 0 for all users created before the
// deploy where the flag does not already exist
// COUNT
// # users to update
db.users.countDocuments({
  created: { $lt: DEPLOY_TIMESTAMP },
  "flags.guidedWorkflowSetup": { $exists: false },
})

// UPDATE
// Set flags.guidedWorkflowSetup: 0 for users created before the deploy where
// the flag does not exist
db.users.updateMany(
  {
    created: { $lt: DEPLOY_TIMESTAMP },
    "flags.guidedWorkflowSetup": { $exists: false },
  },
  { $set: { "flags.guidedWorkflowSetup": 0 } },
)

// VERIFY
// Ensure # users created before the deploy without the flag = 0
db.users.countDocuments({
  created: { $lt: DEPLOY_TIMESTAMP },
  "flags.guidedWorkflowSetup": { $exists: false },
})

// VERIFY
// Ensure no user created after the deploy was seeded. Should be 0.
db.users.countDocuments({
  created: { $gte: DEPLOY_TIMESTAMP },
  "flags.guidedWorkflowSetup": { $exists: true },
})
