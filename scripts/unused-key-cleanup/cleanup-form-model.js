/* eslint-disable */

/*
Map emails array to proper structure
*/

// Check total forms count with responseMode email
db.getCollection('forms').find({ responseMode: 'email' }).count()

// Check total forms count with responseMode email and emails as an array 
// ~ Should be the same number as the total number of email mode forms
db.getCollection('forms').find({ responseMode: 'email', "emails" : { $type : "array" } }).count()

// !!!! MAIN UPDATE SCRIPT !!!!

// Cases
// ['test@hotmail.com'] => ['test@hotmail.com'] ~ unchanged
// ['test@hotmail.com', 'test@gmail.com'] => ['test@hotmail.com', 'test@gmail.com'] ~ unchanged
// ['test@hotmail.com, test@gmail.com'] => ['test@hotmail.com', 'test@gmail.com']
// ['test@hotmail.com, test@gmail.com', 'test@yahoo.com'] => ['test@hotmail.com', 'test@gmail.com', 'test@yahoo.com']

// Update structure of emails key
db.getCollection('forms').find({ responseMode: 'email' }).forEach((form) => { 
    let parsedEmails = form.emails.join(',').split(',').map(item => item.trim())
    db.getCollection('forms').findOneAndUpdate({ _id: form._id }, { $set: { emails: parsedEmails } }) 
})

// !!!! END MAIN UPDATE SCRIPT !!!!

// Check total forms count with responseMode email
// ~ should not have changed from before
db.getCollection('forms').find({ responseMode: 'email' }).count()

// Check total forms count with responseMode email and emails as an array 
// ~ Should be the same number as the total number of email mode forms
db.getCollection('forms').find({ responseMode: 'email', "emails" : { $type : "array" } }).count()
