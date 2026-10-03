// @ts-check
'use strict'

const mongoose = require('mongoose')

const { Schema } = mongoose

// Minimal User schema. `strict: false` keeps unknown fields intact on read,
// but explicit definition of `email` ensures we read it as a string.
const UserSchema = new Schema(
  {
    email: { type: String, required: true },
  },
  { strict: false, collection: 'users' },
)

// Minimal Form schema. We use strict:false so embedded structures (form_fields,
// form_workflows, etc.) round-trip without us redeclaring the full backend schema.
// Phase 3 hydration is a "does it parse" check, not strict validation.
const FormSchema = new Schema(
  {
    emails: { type: [String], default: undefined },
    permissionList: {
      type: [
        new Schema(
          {
            email: { type: String, required: true },
            write: { type: Boolean, default: false },
          },
          { _id: false },
        ),
      ],
      default: undefined,
    },
    form_workflows: { type: [Schema.Types.Mixed], default: undefined },
    form_fields: { type: [Schema.Types.Mixed], default: undefined },
    lastModified: { type: Date },
    responseMode: { type: String },
  },
  {
    strict: false,
    collection: 'forms',
    timestamps: { createdAt: 'created', updatedAt: 'lastModified' },
  },
)

/**
 * @param {string} uri
 */
async function connect(uri) {
  if (!uri) throw new Error('DB_URI is required')
  await mongoose.connect(uri, {
    writeConcern: { w: 'majority' },
    readPreference: 'primary',
  })
  return mongoose.connection
}

async function disconnect() {
  await mongoose.disconnect()
}

function models() {
  const User = mongoose.models.User || mongoose.model('User', UserSchema)
  const Form = mongoose.models.Form || mongoose.model('Form', FormSchema)
  return { User, Form }
}

// Apply on every email-bearing query so 'Eliot@x.gov.sg' matches 'eliot@x.gov.sg'.
// Will fall back to a full collection scan if no case-insensitive index exists,
// which is acceptable for a one-off migration.
const EMAIL_COLLATION = /** @type {const} */ ({ locale: 'en', strength: 2 })

module.exports = { connect, disconnect, models, mongoose, EMAIL_COLLATION }
