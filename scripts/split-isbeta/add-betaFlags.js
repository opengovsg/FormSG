/* eslint-disable */

/*
Adding betaFlags to all users
*/

// var beforeCount
db.getCollection('users').find({}).count()

// numbers updated = total number of users = beforeCount
// set all users to have a betaFlags object with all fields false
db.getCollection('users').update({}, {
    $set: {
        betaFlags: {
            allowEncrypt: false,
            allowMobile: false,
            allowWebhook: false
        }
    }
}, {
    multi: true
})

// var afterCount
db.getCollection('users').find({ betaFlags: {
    allowEncrypt: false,
    allowMobile: false,
    allowWebhook: false
} }).count()

// Check that beforeCount === afterCount 

// var beforeCount
db.getCollection('users').find({ isBeta: true }).count()

// number updated = count of isBeta = beforeCount
// set users that have isBeta true to have allowEncrypt and allow mobile flags set as true
db.getCollection('users').update({
    isBeta: true
}, {
    $set: {
        "betaFlags.allowEncrypt": true,
        "betaFlags.allowMobile": true
    }
}, {
    multi: true,
})

// var afterCount
db.getCollection('users').find({ betaFlags: {
    allowEncrypt: true,
    allowMobile: true,
    allowWebhook: false
} }).count()

// Check that beforeCount === afterCount

/*
Deleting isBeta User Sessions
*/

// Get list of users with isBeta to delete their current sessions
// to prevent any funky behavior where betaFlags is not set
// The following script generates a list of user ids which will be fed into the next script


// var beta_users = list of user ids
// [ObjectId("12345"), ObjectId("23456"), ...]
var cursor = db.getCollection('users').find({isBeta: true})
while (cursor.hasNext()) {
    var record = cursor.next()
    print('ObjectId("' + record._id + '"),')
}

// var beforeTotalCount
db.getCollection('sessions').find({}).count()

// var beforeBetaCount
db.getCollection('sessions').find({ session: { $regex: '\"isBeta\":true' }}).count()

// Delete user sessions
db.getCollection('sessions').deleteMany({
    session: { $regex: '\"isBeta\":true' }
})

// var afterTotalCount
db.getCollection('sessions').find().count()

// var afterBetaCount
db.getCollection('sessions').find({ session: { $regex: '\"isBeta\":true' }}).count()

// Cheeck that beforeTotalCount - beforeBetaCount === afterTotalCount
// Check that afterBetaCount === 0