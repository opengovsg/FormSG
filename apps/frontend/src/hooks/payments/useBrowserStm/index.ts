import { useLocalStorage } from '../../useLocalStorage'

import {
  addEntry,
  deleteEntry,
  deserialize,
  getEntry,
  processEviction,
  serialize,
  StmEntryDto,
} from './utils'

const PAYMENT_STM_KEY = 'PAYMENT_STM_KEY'
/**
 * In local storage, add a marker that a form submission and payment
 * has been submitted and is ongoing. The marker must be cleared when
 * the payment flow is complete. The marker also contains a eviction policy
 * of maximum 1 day, that will be assessed whenever this hook is used.
 *
 * Returns an array of three variables:
 *
 * - `lastPaymentMemory` returns the previous value. It will be an empty string if
 * there's no previous value in memory
 *
 * - `storePaymentMemory` expects the paymentId that will be stored. Replacing
 * the previous value, if any.
 *
 * - `clearPaymentMemory` sets the memory to be an empty string
 *
 * @returns lastPaymentMemory
 */
export const useBrowserStm = (
  formId: string,
): [
  lastPaymentMemory: StmEntryDto | undefined,
  storePaymentMemory: (paymentId: string) => void,
  clearPaymentMemory: () => void,
] => {
  const [paymentMemory, setPaymentMemory] = useLocalStorage(
    PAYMENT_STM_KEY,
    JSON.stringify({}),
  )

  const entryObj = deserialize(paymentMemory || '')
  processEviction(entryObj, (obj) => setPaymentMemory(serialize(obj)))

  const lastPaymentMemory = getEntry(entryObj, formId)
  const storePaymentMemory = (paymentId: string) => {
    const updatedMemory = addEntry(entryObj, { formId, paymentId })
    setPaymentMemory(serialize(updatedMemory))
  }
  const clearPaymentMemory = () => {
    const updatedMemory = deleteEntry(entryObj, { formId })
    setPaymentMemory(serialize(updatedMemory))
  }
  return [lastPaymentMemory, storePaymentMemory, clearPaymentMemory]
}
