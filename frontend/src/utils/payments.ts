export const centsToDollars = (amountCents: number) => {
  const decimalPlaces = 2
  const amountCentsStr = amountCents.toString().padStart(decimalPlaces + 1, '0')
  return `${amountCentsStr.slice(0, -decimalPlaces)}.${amountCentsStr.slice(
    -decimalPlaces,
  )}`
}

export const dollarsToCents = (dollarStr: string) => {
  // Only works with the validation rules applied
  const tokens = dollarStr.trim().split('.')
  return Number(`${tokens[0]}${(tokens[1] ?? '').padEnd(2, '0')}`)
}
