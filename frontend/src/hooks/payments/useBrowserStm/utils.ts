export type StmEntryDto = {
  paymentId: string
  dateCreated: number
}
export type BrowserStmDto = {
  [formId: string]: StmEntryDto
}
export const deserialize = (jsonString: string): BrowserStmDto => {
  try {
    return JSON.parse(jsonString)
  } catch {
    return {}
  }
}
export const serialize = (entryObj: BrowserStmDto) => {
  return JSON.stringify(entryObj)
}
export const processEviction = (data: BrowserStmDto) => {
  // asd
}

export const addEntry = (
  entryObj: BrowserStmDto,
  { formId, paymentId }: { formId: string; paymentId: string },
): BrowserStmDto => {
  entryObj[formId] = {
    paymentId,
    dateCreated: Number(new Date()),
  }
  return entryObj
}

export const deleteEntry = (
  entryObj: BrowserStmDto,
  { formId }: { formId: string },
): BrowserStmDto => {
  delete entryObj[formId]
  return entryObj
}

export const getEntry = (
  entryObj: BrowserStmDto,
  formId: string,
): StmEntryDto => {
  return entryObj[formId]
}
