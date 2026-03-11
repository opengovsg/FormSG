import { Document, Types } from 'mongoose'

/**
 * Type guard for whether given array is a mongoose DocumentArray
 * @param array the array to check
 */
export const isMongooseDocumentArray = <T extends Document>(
  array: T[] & { isMongooseDocumentArray?: boolean },
): array is Types.DocumentArray<T> => {
  /**
   * @see {mongoose.Types.DocumentArray.isMongooseDocumentArray}
   */
  return !!array.isMongooseDocumentArray
}
