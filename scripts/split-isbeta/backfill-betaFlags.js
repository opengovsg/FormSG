/* eslint-disable */

// After the first migration, users that were newly created are not created with betaFlags.
// This is the code to backfill the people that still do not have betaFlags after the 
// fix has been merged into release


// count total number of users with no betaFlags (before)
db.getCollection('users').find({ betaFlags: { $exists: false }}).count()

// count total number of users with betaFlags (before)
db.getCollection('users').find({ betaFlags: { $exists: true } }).count()

// Update people with no betaFlags object with a betaFlags object
db.getCollection('users').update({
    betaFlags: {
        $exists: false
    }
}, {
    $set: { 
        betaFlags: { 
            allowEncrypt: false, 
            allowMobile: false, 
            allowWebhook: false 
        }
    }
}, {
    multi: true,
})

// count total number of users with no betaFlags (after), should be 0
db.getCollection('users').find({ betaFlags: { $exists: false }}).count()

// count total number of users with betaFlags (after), this should be === no betaFlags(before) + betaFlags(before)
db.getCollection('users').find({ betaFlags: { $exists: true }}).count()