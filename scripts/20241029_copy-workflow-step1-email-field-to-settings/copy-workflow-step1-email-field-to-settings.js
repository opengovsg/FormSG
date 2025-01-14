/* eslint-disable */

/**
 * Copies email notification field from workflow[0].field over to its new location at `form.stepOneEmailNotificationFieldId`
 */

// BEFORE
// COUNT existing number of forms with responseMode = multirespondent, workflow[0].workflow_type = dynamic, status = PUBLIC
// Checks that we're only updating the correct forms
db.getCollection('forms').find({
  responseMode: 'multirespondent',
  'workflow.0.workflow_type': 'dynamic',
  status: 'PUBLIC',
})

// UPDATE
db.getCollection('forms')
  .find({
    responseMode: 'multirespondent',
    'workflow.0.workflow_type': 'dynamic',
    status: 'PUBLIC',
  })
  .map((d) => {
    db.getCollection('forms').updateOne(
      {
        _id: d._id,
      },
      {
        $set: {
          stepOneEmailNotificationFieldId: d.workflow[0].field.toString(),
        },
      },
    )
  })

// After
// Should be higher than count in BEFORE
db.getCollection('forms').find({
    responseMode: 'multirespondent',
    stepOneEmailNotificationFieldId: { $exists: true },
    status: 'PUBLIC',
  })
  