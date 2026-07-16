import type { AttachmentAnswerV4, FieldResponseV4 } from '@opengovsg/formsg-sdk'
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

  return _.isEqual(l.answer, r.answer)
}
