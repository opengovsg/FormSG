/**
 * The row content-version gate (PRD #9803 D3), pure and I/O-free.
 *
 * Decides what the Mongo submission row's `encryptedContent` holds:
 * `2` = V4 responses (answer objects with provenance), `1` = V3 responses
 * (the legacy MRF shape produced by `adaptV4ToV3`).
 *
 * No request, mongoose, config or growthbook imports — the consumer class and
 * the flags arrive already resolved, so this is a decision table a test can
 * enumerate exhaustively.
 */

import { WebhookConsumerType } from './webhook-payload-policy'

/**
 * Who reads this form's rows. `'none'` is a form with no webhook configured;
 * zapier is folded into `'generic'` by the caller.
 */
export type RowConsumerClass = WebhookConsumerType | 'none'

/** `mrfVersion` on the stored row. */
export type RowContentVersion = 1 | 2

export interface RowContentVersionInput {
  consumerClass: RowConsumerClass
  /** The `mrf-step-write-token` growthbook flag. */
  isStepWriteTokenEnabled: boolean
}

export const getRowContentVersion = ({
  consumerClass,
  isStepWriteTokenEnabled,
}: RowContentVersionInput): RowContentVersion => {
  switch (consumerClass) {
    case 'none':
      // No downstream consumer to keep on V3.
      return 2
    case 'plumber':
      // Plumber (privileged) reads V4 once the write-guard flag is on.
      return isStepWriteTokenEnabled ? 2 : 1
    case 'generic':
      // Pinned to V3 unconditionally in this slice (PRD #9803 R7). A generic
      // consumer that got a V4 row today would be sent the legacy live-row
      // `getWebhookView` payload, which carries an `encryptedSubmissionSecretKey`
      // — the read-key leak #9740 user story 12 forbids. D1's generic branch
      // lands in S6 (#9746) together with the v1 producer that makes it safe.
      return 1
  }
}
