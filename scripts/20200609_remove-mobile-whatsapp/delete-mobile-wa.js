/* eslint-disable */

/*
Deleting submissions from mobile_wa forms from Submissions Collection
*/

let formsWithMobileWa_0 = db.getCollection('forms').find({ 'form_fields.fieldType': 'mobile_wa' }).map(x => x._id)
db.getCollection('submissions').count()
db.getCollection('submissions').count({ form: { $in: formsWithMobileWa_0 } })
db.getCollection('submissions').deleteMany({ form: { $in: formsWithMobileWa_0 } })
db.getCollection('submissions').count()

/*
Deleting stats from mobile_wa forms from Form Statistics Total Collection
*/

let formsWithMobileWa_1 = db.getCollection('forms').find({ 'form_fields.fieldType': 'mobile_wa' }).map(x => x._id)
db.getCollection('formStatisticsTotal').count()
db.getCollection('formStatisticsTotal').count({ formId: { $in: formsWithMobileWa_1 } })
db.getCollection('formStatisticsTotal').deleteMany({ formId: { $in: formsWithMobileWa_1 } })
db.getCollection('formStatisticsTotal').count()

/*
Deleting stats from mobile_wa forms from Form Statistics Daily Collection
*/

let formsWithMobileWa_2 = db.getCollection('forms').find({ 'form_fields.fieldType': 'mobile_wa' }).map(x => x._id)
db.getCollection('formStatisticsDaily').count()
db.getCollection('formStatisticsDaily').count({ formId: { $in: formsWithMobileWa_2 } })
db.getCollection('formStatisticsDaily').deleteMany({ formId: { $in: formsWithMobileWa_2 } })
db.getCollection('formStatisticsDaily').count()

/*
Deleting feedback from mobile_wa forms from Form Feedback Collection
*/

let formsWithMobileWa_3 = db.getCollection('forms').find({ 'form_fields.fieldType': 'mobile_wa' }).map(x => x._id)
db.getCollection('formfeedback').count()
db.getCollection('formfeedback').count({ formId: { $in: formsWithMobileWa_3 } })
db.getCollection('formfeedback').deleteMany({ formId: { $in: formsWithMobileWa_3 } })
db.getCollection('formfeedback').count()

/*
Deleting logins linked mobile_wa forms from Logins Collection
*/

let formsWithMobileWa_4 = db.getCollection('forms').find({ 'form_fields.fieldType': 'mobile_wa' }).map(x => x._id)
db.getCollection('logins').count()
db.getCollection('logins').count({ form: { $in: formsWithMobileWa_4 } })
db.getCollection('logins').deleteMany({ form: { $in: formsWithMobileWa_4 } })
db.getCollection('logins').count()

/*
Deleting mobile_wa forms from Form Collection
*/

// This must be done last
let formsWithMobileWa_5 = db.getCollection('forms').find({ 'form_fields.fieldType': 'mobile_wa' }).map(x => x._id)
db.getCollection('forms').count()
db.getCollection('forms').count({ _id: { $in: formsWithMobileWa_5 } })
db.getCollection('forms').deleteMany({ _id: { $in: formsWithMobileWa_5 } })
db.getCollection('forms').count()
