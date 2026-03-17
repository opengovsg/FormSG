/**
 * Converts address field info as Single Responses into single-line string for response page display
 * String manipulation done on frontend in DecryptRow
 * since backend requires inputs to be single responses for info to be separate csv columns
 *
 * @param responses ["161","BUKIT BATOK STREET 11","","01","02","650161"]
 * @return ["161 BUKIT BATOK STREET 11, #01-02, SINGAPORE 650161"]
 */
export const handleAddressResponseDisplay = (responses: string[]): string[] => {
  const [
    blockNumber,
    streetName,
    buildingName,
    levelNumber,
    unitNumber,
    postalCode,
  ] = responses

  const formattedLevelUnitNumber =
    levelNumber && unitNumber
      ? `#${levelNumber}-${unitNumber}`
      : [levelNumber, unitNumber]

  const formattedPostalCode = postalCode
    ? `SINGAPORE ${postalCode}`
    : postalCode

  const formattedFullAddress = [
    blockNumber,
    streetName,
    buildingName,
    ...(Array.isArray(formattedLevelUnitNumber)
      ? formattedLevelUnitNumber
      : [formattedLevelUnitNumber]),
    formattedPostalCode,
  ]
    .filter((s: string) => s !== '')
    .join(', ')
  return [formattedFullAddress]
}

/** the order of the address input answer array*/
export const answerKey = [
  'blockNumber',
  'streetName',
  'buildingName',
  'levelNumber',
  'unitNumber',
  'postalCode',
]
