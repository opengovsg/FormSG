import { differenceInHours } from 'date-fns'
import throttle from 'lodash/throttle'

export type StmEntryDto = {
  paymentId: string
  dateCreated: number
}
export type BrowserStmDto = {
  [formId: string]: StmEntryDto
}

const EXPIRY_TIME_IN_HRS = 24 // 1 day
const EVICTION_DEBOUNCE_TIME = 1000 * 20 // 20 seconds

const _processEviction = (
  entryObj: BrowserStmDto,
  setStateCallbackFn: (newEntryObj: BrowserStmDto) => void,
) => {
  const curTime = Date.now()
  const returnObj = { ...entryObj }
  Object.keys(returnObj).forEach((formId) => {
    const { dateCreated } = returnObj[formId]
    const deltaHrs = differenceInHours(curTime, new Date(dateCreated))
    if (deltaHrs > EXPIRY_TIME_IN_HRS) {
      delete returnObj[formId]
    }
  })
  setStateCallbackFn(returnObj)
}

export const processEviction = throttle(
  _processEviction,
  EVICTION_DEBOUNCE_TIME,
  { leading: true, trailing: false },
)

export const deserialize = (jsonString: string): BrowserStmDto => {
  let parsedObj
  try {
    parsedObj = JSON.parse(jsonString)
  } catch {
    parsedObj = {}
  }
  return parsedObj
}

export const serialize = (entryObj: BrowserStmDto) => {
  return JSON.stringify(entryObj)
}

export const addEntry = (
  entryObj: BrowserStmDto,
  { formId, paymentId }: { formId: string; paymentId: string },
): BrowserStmDto => {
  return {
    ...entryObj,
    [formId]: {
      paymentId,
      dateCreated: Date.now(),
    },
  }
}

export const deleteEntry = (
  entryObj: BrowserStmDto,
  { formId }: { formId: string },
): BrowserStmDto => {
  const returnObj = { ...entryObj }
  delete returnObj[formId]
  return returnObj
}

export const getEntry = (
  entryObj: BrowserStmDto,
  formId: string,
): StmEntryDto => {
  return entryObj[formId]
}
