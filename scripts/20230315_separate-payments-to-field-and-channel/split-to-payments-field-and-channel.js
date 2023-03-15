/* eslint-disable */

/*
Split payments property on form documents into payments_fields and payments_channel
*/

/*
Count number of forms that contains payments property
*/
db.getCollection("forms").find({payments: {$ne: null }}).count()

/*
Count number of forms that contains the payments_field and payments_channel properties
This should be 0
*/
db.getCollection("forms").find({$and:[
    {payments_field: {$ne: null }},
    {payments_channel: {$ne: null }}
]}).count()

/*
Create payments_field and payments_channel from existing payments 
*/ 
db.getCollection("forms").updateMany(
    {payments: {$ne: null }},
    [{
        $set: {payments_field: {
            enabled: "$payments.enabled",
            description: "$payments.description",
            amount_cents: "$payments.amount_cents",
            }
        }
    },
    {
        $set: {payments_channel: {
            channel: "Stripe",
            target_account_id: "$payments.target_account_id",
            publishable_key: "$payments.publishable_key",
            }
        }
    }]
)

/*
Count of forms with payments_field and payments_channels should be equivalent to original number of
forms with payments 
*/
db.getCollection("forms").find({$and:[
    {payments_field: {$ne: null }},
    {payments_channel: {$ne: null }}
]}).count()


/*
Remove payments property from forms 
*/
db.getCollection("forms").updateMany(
    {payments: {$ne: null }},
    {
        $unset: {payments: ""}
    }
)

/*
Count of forms with payment field should be 0
*/
db.getCollection("forms").find({payments: {$ne: null }}).count()
