import type {
  AttachmentAnswerV4,
  FieldResponseV4,
  TableAnswerV4,
} from '@opengovsg/formsg-sdk'
import _ from 'lodash'

export const isFieldResponseV4Equal = (
  l: FieldResponseV4,
  r: FieldResponseV4,
): boolean => {
  if (l.fieldType !== r.fieldType) return false

  if (l.fieldType === 'attachment') {
    const lMd5 = (l.answer as AttachmentAnswerV4).md5Hash
    const rMd5 = (r.answer as AttachmentAnswerV4).md5Hash
    return !lMd5 || !rMd5 || lMd5 === rMd5
  }

  if (l.fieldType === 'table') {
    // Row keys are minted fresh on every V3→V4 adaptation, so the same table
    // content can carry different keys on each side. Compare rows by rowNum
    // order and content instead of by key.
    const sortRows = (answer: TableAnswerV4) =>
      Object.values(answer).sort((a, b) => a.rowNum - b.rowNum)
    return _.isEqual(
      sortRows(l.answer as TableAnswerV4),
      sortRows(r.answer as TableAnswerV4),
    )
  }

  return _.isEqual(l.answer, r.answer)
}
