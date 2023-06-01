/* eslint-disable */

/*
Adding payment beta flag to specfic user
*/

/*
List of user emails to add payment flag to
*/
const emails = [
    // user emails to update
]

/* 
Count of users who should have payment flag added to
*/
emails.length

/*
Get count of users who are to 
*/

db.getCollection('users')
  .find({email: {$in: emails}})
  .count();

// check length of emails to count of users 

/*
Get count of current users who have payment set to true
*/
db.getCollection('users').find({ betaFlags: {
    payment: true
} }).count()

/*
Update selected user's payment betaflag to true
*/
db.getCollection('users').update({
    email: {$in: emails}
}, {
    $set: {
        betaFlags: {
            payment: true
        }
    }
}, {
    multi: true
})

/*
Get count of updated number of users who have payment set to true
*/
db.getCollection('users').find({ betaFlags: {
    payment: true
} }).count()

// check that beforeCount === afterCount + noOfUsersToAdd