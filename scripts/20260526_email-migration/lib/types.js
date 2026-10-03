// @ts-check
'use strict'

/**
 * Shared JSDoc typedefs used across the migration script.
 *
 * Keep types loose around Mongoose models — we use `strict: false` schemas and
 * lean queries, so doc shapes are dictated by the data, not the schema. Where
 * we know a field's shape, we narrow it at the call site.
 */

/** @typedef {Map<string, string>} EmailMap */

/**
 * @typedef {import('mongoose').Model<any>} AnyModel
 * @typedef {import('mongoose')} MongooseLib
 */

/**
 * @typedef {'add' | 'replace'} Mode
 *
 * @typedef {Object} PhaseContext
 * @property {AnyModel} User
 * @property {AnyModel} Form
 * @property {MongooseLib} mongoose
 * @property {EmailMap} mapping
 * @property {import('./backup').BackupStore} backup
 * @property {import('./rate-limit').TokenBucket} bucket
 * @property {number} batchSize
 * @property {boolean} dryRun
 * @property {Mode} mode
 */

/**
 * @typedef {Object} AuditRecord
 * @property {string} [ts]
 * @property {string} phase
 * @property {string} _id
 * @property {string} status
 * @property {Mode} [mode]
 * @property {string} [oldEmail]
 * @property {string} [newEmail]
 * @property {string} [stepId]
 * @property {string} [fieldId]
 * @property {string} [optionKey]
 * @property {string[]} [originalEmails]
 * @property {string[]} [newEmails]
 * @property {string[]} [originalRecipients]
 * @property {string[]} [newRecipients]
 * @property {string[]} [merged]
 * @property {number} [originalLength]
 * @property {number} [newLength]
 * @property {Date | string | null} [lastModifiedAtScan]
 * @property {{ matched: number, modified: number }} [updateResult]
 * @property {string} [oldUserId]
 * @property {string} [newUserId]
 * @property {string} [error]
 */

/**
 * Permission entry on a Form. Email is always lowercased by the production
 * schema's setter, but we re-normalize defensively at read time.
 * @typedef {Object} PermissionEntry
 * @property {string} email
 * @property {boolean} write
 */

/**
 * Minimal shape we read from a workflow step. Production schema has more.
 * @typedef {Object} WorkflowStep
 * @property {import('bson').ObjectId} _id
 * @property {string} workflow_type
 * @property {string[]} [emails]
 */

/**
 * Minimal shape we read from a dropdown form field.
 * @typedef {Object} DropdownField
 * @property {import('bson').ObjectId} _id
 * @property {string} fieldType
 * @property {Record<string, string[]>} [optionsToRecipientsMap]
 */

module.exports = {}
