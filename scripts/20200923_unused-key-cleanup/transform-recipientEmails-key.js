/* eslint-disable */

/*
Map recipientEmails array to proper structure
*/

// Check total submissions with submissionType emailSubmission
db.getCollection('submissions').find({ submissionType: 'emailSubmission' }).count()

// Check total submissions count with submissionType emailSubmission and recipientEmails as an array 
// ~ Should be the same number as the total number of emailSubmission submissions
db.getCollection('submissions').find({ submissionType: 'emailSubmission', "recipientEmails": { $type: "array" } }).count()

// Check total submissions count with submissionType emailSubmission and recipientEmails with delimiter ; 
db.getCollection('submissions').find({ recipientEmails: { $regex: /;/ }, submissionType: 'emailSubmission' }).count()

// Check total submissions count with submissionType emailSubmission and recipientEmails with delimiter ,
db.getCollection('submissions').find({ recipientEmails: { $regex: /,/ }, submissionType: 'emailSubmission' }).count()

// Check total submissions count with submissionType emailSubmission and recipientEmails in correct format
let isValidAfterBefore = 0 
db.getCollection('submissions').find({ submissionType: 'emailSubmission' }).forEach((submission) => {
  let isValid = submission.recipientEmails.every((email) => {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return re.test(email)
  })
  isValidAfterBefore += (isValid ? 1 : 0)
})
print('isValidAfterBefore', isValidAfterBefore)

// !!!! MAIN UPDATE SCRIPT !!!!

// Cases
// ['test@hotmail.com'] => ['test@hotmail.com'] ~ unchanged
// ['test@hotmail.com', 'test@gmail.com'] => ['test@hotmail.com', 'test@gmail.com'] ~ unchanged
// ['test@hotmail.com, test@gmail.com'] => ['test@hotmail.com', 'test@gmail.com']
// ['test@hotmail.com, test@gmail.com', 'test@yahoo.com'] => ['test@hotmail.com', 'test@gmail.com', 'test@yahoo.com']
// ['test@hotmail.com; test@gmail.com; test@yahoo.com'] => ['test@hotmail.com', 'test@gmail.com', 'test@yahoo.com']
// ['test@hotmail.com; test@gmail.com; test@yahoo.com;'] => ['test@hotmail.com', 'test@gmail.com', 'test@yahoo.com']
// ['wee_ching_ni@pa.gov.sg;'] => ['wee_ching_ni@pa.gov.sg']

// Update structure of recipientEmails key
let requests = []
db.getCollection('submissions').find({ submissionType: 'emailSubmission' }).forEach((submission) => {
  let parsedEmails = submission.recipientEmails
    .join(',')
    .replace(/;/g, ',')
    .split(',')
    .map(item => item.trim().toLowerCase())
    .filter((email) => email.includes('@')) // remove ""
  requests.push({
    updateOne: {
      filter: { _id: submission._id },
      update: { $set: { recipientEmails: parsedEmails } }
    }
  })
  if (requests.length === 500) {
    //Execute per 500 operations and re-init
    db.collection.bulkWrite(requests);
    requests = [];
  }
})
if (requests.length > 0) {
  db.collection.bulkWrite(requests);
}

// !!!! END MAIN UPDATE SCRIPT !!!!

// Check total submissions count with submissionType emailSubmission
// ~ should not have changed from before
db.getCollection('submissions').find({ submissionType: 'emailSubmission' }).count()

// Check total submissions count with submissionType emailSubmission and recipientEmails as an array 
// ~ Should be the same number as the total number of emailSubmission submissions
db.getCollection('submissions').find({ submissionType: 'emailSubmission', "recipientEmails": { $type: "array" } }).count()

// Check total submissions count with submissionType emailSubmission and recipientEmails with delimiter ; 
// ~ should be zero
db.getCollection('submissions').find({ recipientEmails: { $regex: /;/ }, submissionType: 'emailSubmission' }).count()

// Check total submissions count with submissionType emailSubmission and recipientEmails with delimiter ,
// ~ should be zero
db.getCollection('submissions').find({ recipientEmails: { $regex: /,/ }, submissionType: 'emailSubmission' }).count()

// Check total submissions count with submissionType emailSubmission and recipientEmails in correct format
// ~ Should be the same number as the total number of email mode forms
let isValidAfter = 0 
db.getCollection('submissions').find({ submissionType: 'emailSubmission' }).forEach((submission) => {
  let isValid = submission.recipientEmails.every((email) => {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return re.test(email)
  })
  isValidAfter += (isValid ? 1 : 0)
})
print('isValidAfter', isValidAfter)
