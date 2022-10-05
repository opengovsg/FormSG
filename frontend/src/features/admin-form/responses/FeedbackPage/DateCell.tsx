import { useMemo } from 'react'
import { Text } from '@chakra-ui/react'
import { intlFormat } from 'date-fns'

export interface DateCellProps {
  value: number
}

export const DateCell = ({ value }: DateCellProps): JSX.Element => {
  const shortLocaleDateString = useMemo(() => {
    return intlFormat(new Date(value), {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }, [value])

  const fullLocaleDateString = useMemo(
    () =>
      intlFormat(new Date(value), {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        timeZoneName: 'short',
      }),
    [value],
  )

  // Render timestamp as locale-aware date
  return <Text title={fullLocaleDateString}>{shortLocaleDateString}</Text>
}
