/* eslint-disable */
// Find admins of forms with duplicate MyInfo attrs
const countMyInfoAttrsPipeline = [
  // Forms with MyInfo fields
  { $match: { 'form_fields.myInfo': { $exists: true } } },
  { $project: { form_fields: 1, admin: 1 } },
  { $unwind: '$form_fields' },
  // MyInfo fields. Each document's ID is the form ID.
  { $match: { 'form_fields.myInfo': { $exists: true } } },
  { $group: 
    {
      _id: '$_id',
      // Array of all MyInfo attributes from a form
      attrsArray: { $push: '$form_fields.myInfo.attr' },
      // Set of unique MyInfo attributes from a form
      attrsSet: { $addToSet: '$form_fields.myInfo.attr' },
      admin: { $first: '$admin' },
    },
  },
  { $project:
    {
      isEqual: {
        // Compare size of array and set
        $eq: [ { $size: '$attrsArray' }, { $size: '$attrsSet' } ],
      },
      admin: 1,
    },
  },
  // Filter for non-equal size
  { $match: { isEqual: false } },
  // Lookup admin emails
  { $lookup:
    {
      from: 'users',
      localField: 'admin',
      foreignField: '_id',
      as: 'admins',
    },
  },
  // $lookup is one-to-many, but we should only find one admin for each ID
  { $project:
    {
      admin: { $arrayElemAt: ['$admins', 0] },
    },
  },
]
// Get email of each admin
const emails = db.getCollection('forms').aggregate(countMyInfoAttrsPipeline).map((doc) => doc.admin.email)
const emailSet = new Set(emails)
Array.from(emailSet)
