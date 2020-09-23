/* eslint-disable */

/*
Map emails array to proper structure
*/

// Check total forms count with responseMode email
db.getCollection('forms').find({ responseMode: 'email' }).count()

// Check total forms count with responseMode email and emails as an array 
// ~ Should be the same number as the total number of email mode forms
db.getCollection('forms').find({ responseMode: 'email', "emails": { $type: "array" } }).count()

// Check total forms count with responseMode email and emails with delimiter ; 
db.getCollection('forms').find({ emails: { $regex: /;/ }, responseMode: 'email' }).count()

// Check total forms count with responseMode email and emails with delimiter ,
db.getCollection('forms').find({ emails: { $regex: /,/ }, responseMode: 'email' }).count()

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
    .split(',')
    .map(item => item.trim())
    .filter((email) => email.includes('@')) // remove ""
  requests.push({
    updateOne: {
      filter: { _id: form._id },
      update: { $set: { emails: parsedEmails } }
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

// Check total forms count with responseMode email
// ~ should not have changed from before
db.getCollection('forms').find({ responseMode: 'email' }).count()

// Check total forms count with responseMode email and emails as an array 
// ~ Should be the same number as the total number of email mode forms
db.getCollection('forms').find({ responseMode: 'email', "emails": { $type: "array" } }).count()

// Check total forms count with responseMode email and emails with delimiter ; 
// ~ should be zero
db.getCollection('forms').find({ emails: { $regex: /;/ }, responseMode: 'email' }).count()

// Check total forms count with responseMode email and emails with delimiter ,
// ~ should be zero
db.getCollection('forms').find({ emails: { $regex: /,/ }, responseMode: 'email' }).count()