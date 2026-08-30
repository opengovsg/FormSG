import { Document, Model, Mongoose, Schema } from 'mongoose'

export const CHANGELOG_DIGEST_SCHEMA_ID = 'ChangelogDigest'

/**
 * Where a digest is in its life.
 *
 * - `draft`      generated, has enough to send, waiting to be approved
 * - `held`       generated, found too little to be worth sending
 * - `sent`       approved and emailed
 * - `superseded` a later cycle drafted over it before it was approved
 *
 * `held` and `superseded` both mean "this week produced no email", but they are
 * not the same thing and collapsing them would hide which. `held` is the
 * pipeline working as designed; `superseded` means a draft sat unapproved long
 * enough for the next one to overtake it, which is worth being able to notice.
 */
export type DigestStatus = 'draft' | 'held' | 'sent' | 'superseded'

/** One item as it was drafted. */
export type StoredDigestItem = {
  title: string
  body: string
  sourcePullRequests: number[]
}

export interface IChangelogDigestSchema extends Document {
  /**
   * ISO week the cycle ran in, as `2026-W35`. Unique, which is what makes
   * generation idempotent: a second run in the same week finds this row and
   * does nothing rather than drafting again.
   */
  week: string
  status: DigestStatus
  generatedAt: Date
  /** Set only once the digest has been approved and emailed. */
  sentAt?: Date
  /**
   * The span the cycle covered. On a `sent` digest, `until` is where the next
   * cycle starts reading from.
   */
  window: { since: string; until: string }
  /** Every candidate the generator returned, ranked most notable first. */
  items: StoredDigestItem[]
  /** Who it went to. Empty until sent. */
  recipients: string[]
}

export interface IChangelogDigestModel extends Model<IChangelogDigestSchema> {
  /**
   * The most recently *sent* digest, or `null` if none has ever been sent.
   *
   * Deliberately not "the most recent digest". A cycle covers everything merged
   * since readers were last told something, so a week that was held or
   * superseded must not move the line — otherwise its changes would be skipped
   * over and never reported at all.
   */
  getLastSent(): Promise<IChangelogDigestSchema | null>

  /** The digest for a given ISO week, if a cycle has already run in it. */
  getByWeek(week: string): Promise<IChangelogDigestSchema | null>

  /**
   * Marks every unapproved draft as superseded.
   *
   * Called when a new draft is about to be created. The new one covers a strict
   * superset of the old one's window, so approving the old one would send a
   * digest that omits the most recent week — the failure this prevents.
   */
  supersedeOpenDrafts(): Promise<number>

  /** Recent digests, newest first, for looking up an id to approve. */
  listRecent(limit: number): Promise<IChangelogDigestSchema[]>
}

const ChangelogDigestSchema = new Schema<
  IChangelogDigestSchema,
  IChangelogDigestModel
>({
  week: {
    type: String,
    required: true,
    unique: true,
  },
  status: {
    type: String,
    required: true,
    enum: ['draft', 'held', 'sent', 'superseded'],
  },
  generatedAt: {
    type: Date,
    required: true,
    default: Date.now,
  },
  sentAt: { type: Date },
  window: {
    since: { type: String, required: true },
    until: { type: String, required: true },
  },
  items: [
    {
      title: { type: String, required: true },
      body: { type: String, required: true },
      sourcePullRequests: [{ type: Number }],
    },
  ],
  recipients: [{ type: String }],
})

// Reading the last sent digest happens on every cycle and is the one query that
// has to stay fast as the collection grows.
ChangelogDigestSchema.index({ status: 1, sentAt: -1 })

ChangelogDigestSchema.statics.getLastSent = async function (
  this: IChangelogDigestModel,
) {
  return this.findOne({ status: 'sent' }).sort({ sentAt: -1 }).exec()
}

ChangelogDigestSchema.statics.getByWeek = async function (
  this: IChangelogDigestModel,
  week: string,
) {
  return this.findOne({ week }).exec()
}

ChangelogDigestSchema.statics.supersedeOpenDrafts = async function (
  this: IChangelogDigestModel,
) {
  const { modifiedCount } = await this.updateMany(
    { status: 'draft' },
    { $set: { status: 'superseded' } },
  ).exec()
  return modifiedCount
}

ChangelogDigestSchema.statics.listRecent = async function (
  this: IChangelogDigestModel,
  limit: number,
) {
  return this.find().sort({ generatedAt: -1 }).limit(limit).exec()
}

const getChangelogDigestModel = (db: Mongoose): IChangelogDigestModel => {
  try {
    return db.model(CHANGELOG_DIGEST_SCHEMA_ID) as IChangelogDigestModel
  } catch {
    return db.model<IChangelogDigestSchema, IChangelogDigestModel>(
      CHANGELOG_DIGEST_SCHEMA_ID,
      ChangelogDigestSchema,
    )
  }
}

export default getChangelogDigestModel
