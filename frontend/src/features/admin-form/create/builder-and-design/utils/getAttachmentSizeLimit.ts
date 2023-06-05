import { AttachmentSize, FormResponseMode } from '~shared/types'

export const getAttachmentSizeLimit = (
  responseMode?: FormResponseMode,
): number => {
  if (!responseMode) return 0
  switch (responseMode) {
    case FormResponseMode.Email:
      return Number(AttachmentSize.SevenMb)
    case FormResponseMode.Encrypt:
      return Number(AttachmentSize.TwentyMb)
    default:
      return 0
  }
}
