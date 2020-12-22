/**
 * This file contains mapping layers for `verifiedContent` in encrypted submission
 * data.
 * The mapping layers will translate certain keys such as SingPass login key
 * values to keys that our application has designated.
 */
import values from 'lodash/values'

// Shared centralised mapping layer for use in both frontend and backend to get the mapped value.
export enum VerifiedKeys {
  SpUinFin = 'uinFin',
  CpUen = 'cpUen',
  CpUid = 'cpUid',
}

/**
 * Array determines the order to process and display the verified fields in both
 * the detailed responses page and the csv file.
 */
export const CURRENT_VERIFIED_FIELDS: VerifiedKeys[] = values(VerifiedKeys)
