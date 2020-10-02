import { FieldResponse } from 'src/types'

export type ProcessedFieldResponse = FieldResponse & {
  isVisible?: boolean
  isUserVerified?: boolean
  answer?: string | undefined | null
}
