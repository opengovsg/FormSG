/* eslint-disable */

// Creates a new workflow key in all existing mrf submissions, populated with
// the form's existing workflow. From this point on, workflows should be captured
// when the submission is initially created (i.e. the workflow is started),

// BEFORE
// COUNT existing number of MRF submissions with no workflow key 
db.submissions.aggregate([
  {
    $match: {
      submissionType: 'multirespondentSubmission',
      workflow: { $exists: false },
    },
  },
  {
    $lookup: {
      from: 'forms',
      localField: 'form',
      foreignField: '_id',
      as: 'forms',
    },
  },
  {
    $addFields: {
      formWorkflow: { $first: '$forms.workflow' },
    },
  },
  {
    $match: {
      formWorkflow: { $exists: true },
    },
  },
  {
    $count: 'count',
  },
])

// UPDATE
db.submissions.aggregate([
  {
    $match: {
      submissionType: 'multirespondentSubmission',
    },
  },
  {
    $lookup: {
      from: 'forms',
      localField: 'form',
      foreignField: '_id',
      as: 'forms',
    },
  },
  {
    $addFields: {
      workflow: { $first: '$forms.workflow' },
    },
  },
  {
    $merge: {
      into: 'submissions',
      on: '_id',
      whenNotMatched: 'discard',
    },
  },
])

// AFTER
// Count number of MRF submissions with workflow key
// Expect this to match the COUNT in BEFORE
db.submissions.aggregate([
  {
    $match: {
      submissionType: 'multirespondentSubmission',
      workflow: { $exists: true },
    },
  },
  {
    $lookup: {
      from: 'forms',
      localField: 'form',
      foreignField: '_id',
      as: 'forms',
    },
  },
  {
    $addFields: {
      formWorkflow: { $first: '$forms.workflow' },
    },
  },
  {
    $match: {
      formWorkflow: { $exists: true },
    },
  },
  {
    $count: 'count',
  },
])
