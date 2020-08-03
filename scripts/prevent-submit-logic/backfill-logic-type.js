/* eslint-disable */

// BEFORE
// Count total number of logic units
const beforePipelineAllUnits = [
  { '$match': { 'form_logics': { '$exists': true, '$not': { '$size': 0 } } } },
  { '$project': { 'form_logics': 1 } },
  { '$unwind': '$form_logics' },
  { '$count': 'numLogicUnits' }
]
db.getCollection('forms').aggregate(beforePipelineAllUnits)

// Count number of logic units without logicType field. Should be equal to total number of logic units.
const beforePipelineNoLogicType = [
  { '$match': { 'form_logics': { '$exists': true, '$not': { '$size': 0 }, '$elemMatch': { 'logicType': { '$exists': false } } } } },
  { '$project': { 'form_logics': 1 } },
  { '$unwind': '$form_logics' },
  { '$match': { 'form_logics.logicType': { '$exists': false } } },
  { '$count': 'numLogicUnits' }
]
db.getCollection('forms').aggregate(beforePipelineNoLogicType)

// UPDATE
db.getCollection('forms').update(
  { 'form_logics': { '$exists': true, '$not': { '$size': 0 }, '$elemMatch': { 'logicType': { '$exists': false } } } },
  { '$set': { 'form_logics.$[logicUnit].logicType': 'showFields' } },
  { 'arrayFilters': [ { 'logicUnit.logicType': { '$exists': false } } ], 'multi': true }
)

// AFTER
// Count number of logic units with logicType === 'showFields'. Ideally should be equal to total number of logic units,
// but not necessarily if there were updates in between.
const afterPipelineWithShowFields = [
  { '$match': { 'form_logics': { '$exists': true, '$not': { '$size': 0 }, '$elemMatch': { 'logicType': 'showFields' } } } },
  { '$project': { 'form_logics': 1 } },
  { '$unwind': '$form_logics' },
  { '$count': 'numLogicUnits' }
]
db.getCollection('forms').aggregate(afterPipelineWithShowFields)

// Count number of logic units without logicType field. Should be 0 if there were no updates in between.
const afterPipelineWithoutShowFields = [
  { '$match': { 'form_logics': { '$exists': true, '$not': { '$size': 0 }, '$elemMatch': { 'logicType': { '$exists': false } } } } },
  { '$project': { 'form_logics': 1 } },
  { '$unwind': '$form_logics' },
  { '$match': { 'form_logics.logicType': { '$exists': false } } },
  { '$count': 'numLogicUnits' }
]
db.getCollection('forms').aggregate(afterPipelineWithoutShowFields)
