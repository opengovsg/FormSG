/* eslint-disable */
sleep(5000)

conn = new Mongo()
db = conn.getDB('formsg')
db.createCollection('agencies')
// Upsert if not exist
db.agencies.update(
  { shortName: 'govtech' },
  {
    $setOnInsert: {
      shortName: 'govtech',
      fullName: 'Government Technology Agency',
      logo: 'https://s3-ap-southeast-1.amazonaws.com/agency-logo.form.sg/govtech.jpg',
      emailDomain: ['tech.gov.sg', 'data.gov.sg', 'form.sg', 'open.gov.sg'],
    },
  },
  { upsert: true },
)
