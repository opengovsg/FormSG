/* eslint-disable */

/*
Map emails array to proper structure
*/

// Check total forms count with responseMode email
db.getCollection('forms').find({ responseMode: 'email' }).count()

// Check total forms count with responseMode email and emails as an array 
// ~ Should be the same number as the total number of email mode forms
db.getCollection('forms').find({ responseMode: 'email', emails: { $type: 'array' } }).count()

// Check total forms count with responseMode email and emails with delimiter ; 
db.getCollection('forms').find({ emails: { $regex: /;/ }, responseMode: 'email' }).count()

// Check total forms count with responseMode email and emails with delimiter ,
db.getCollection('forms').find({ emails: { $regex: /,/ }, responseMode: 'email' }).count()

// Check total forms count with responseMode email and emails in correct format
let isValidCountBefore = 0 
db.getCollection('forms').find({ responseMode: 'email' }).forEach((form) => {
  let isValid = form.emails.every((email) => {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return re.test(email)
  })
  isValidCountBefore += (isValid ? 1 : 0)
})
print('isValidCountBefore', isValidCountBefore)

// !!!! MAIN UPDATE SCRIPT !!!!

// Cases
// ['test@hotmail.com'] => ['test@hotmail.com'] ~ unchanged
// ['test@hotmail.com', 'test@gmail.com'] => ['test@hotmail.com', 'test@gmail.com'] ~ unchanged
// ['test@hotmail.com, test@gmail.com'] => ['test@hotmail.com', 'test@gmail.com']
// ['test@hotmail.com, test@gmail.com', 'test@yahoo.com'] => ['test@hotmail.com', 'test@gmail.com', 'test@yahoo.com']
// ['test@hotmail.com; test@gmail.com; test@yahoo.com'] => ['test@hotmail.com', 'test@gmail.com', 'test@yahoo.com']
// ['test@hotmail.com; test@gmail.com; test@yahoo.com;'] => ['test@hotmail.com', 'test@gmail.com', 'test@yahoo.com']
// ['wee_ching_ni@pa.gov.sg;'] => ['wee_ching_ni@pa.gov.sg']

// Update structure of emails key
let requests = []
db.getCollection('forms').find({ responseMode: 'email' }).forEach((form) => {
  let parsedEmails = form.emails
    .join(',')
    .replace(/;/g, ',')
    .replace(/\s/g, ',')
    .split(',')
    .map(item => item.trim().toLowerCase())
    .filter((email) => email.includes('@')) // remove ""
  requests.push({
    updateOne: {
      filter: { _id: form._id },
      update: { $set: { emails: parsedEmails } }
    }
  })
  if (requests.length === 500) {
    //Execute per 500 operations and re-init
    db.getCollection('forms').bulkWrite(requests);
    requests = [];
  }
})
if (requests.length > 0) {
  db.getCollection('forms').bulkWrite(requests);
}

// !!!! END MAIN UPDATE SCRIPT !!!!

// Check total forms count with responseMode email
// ~ should not have changed from before
db.getCollection('forms').find({ responseMode: 'email' }).count()

// Check total forms count with responseMode email and emails as an array 
// ~ Should be the same number as the total number of email mode forms
db.getCollection('forms').find({ responseMode: 'email', emails: { $type: 'array' } }).count()

// Check total forms count with responseMode email and emails with delimiter ; 
// ~ should be zero
db.getCollection('forms').find({ emails: { $regex: /;/ }, responseMode: 'email' }).count()

// Check total forms count with responseMode email and emails with delimiter ,
// ~ should be zero
db.getCollection('forms').find({ emails: { $regex: /,/ }, responseMode: 'email' }).count()

// Check total forms count with responseMode email and emails in correct format
// ~ Should be the same number as the total number of email mode forms
let isValidCountAfter = 0
db.getCollection('forms').find({ responseMode: 'email' }).forEach((form) => {
  let isValid = form.emails.every((email) => {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return re.test(email)
  })
  isValidCountAfter += (isValid ? 1 : 0)
})
print('isValidCountAfter', isValidCountAfter)