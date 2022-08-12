import { useMemo } from 'react'
import { Box, BoxProps, Flex, Grid, Skeleton, Stack } from '@chakra-ui/react'
import { valueToPercent } from '@chakra-ui/utils'

export interface AttachmentStackedBarProps {
  /** Existing values to render in the stacked bar. If `undefined` the progress
   * bar will be in the loading state */
  existingValues?: number[]
  /** The new value to add into the stacked bar. */
  newValue?: number
  /** The min value of the bar. Defaults to `0` if not provided. */
  min?: number
  /** The maximum value of the bar */
  max: number
}

const FilledTrack = (props: BoxProps) => {
  return (
    <Box
      h="100%"
      w="100%"
      _first={{
        borderStartRadius: '3px',
      }}
      _last={{
        borderEndRadius: '3px',
      }}
      {...props}
    />
  )
}

export const AttachmentStackedBar = ({
  existingValues: existingValuesProp,
  newValue = 0,
  min = 0,
  max,
}: AttachmentStackedBarProps): JSX.Element => {
  const isLoading = useMemo(() => !existingValuesProp, [existingValuesProp])

  const existingValues = useMemo(
    () => existingValuesProp ?? [],
    [existingValuesProp],
  )

  const totalAttachmentSize = useMemo(
    () => existingValues.reduce((sum, v) => sum + v, 0) + newValue,
    [existingValues, newValue],
  )

  const isOverQuota = useMemo(
    () => !!existingValues && max < totalAttachmentSize,
    [max, totalAttachmentSize, existingValues],
  )

  const barProps = useMemo(() => {
    const barProps = existingValues.map(() => ({
      bg: 'warning.500',
      border: 'none',
    }))
    if (newValue > 0)
      barProps.push({
        bg: 'success.500',
        border: '1px dashed var(--chakra-colors-success-800)',
      })
    return barProps
  }, [existingValues, newValue])

  const gridTemplateColumns = useMemo(() => {
    const gridTemplateColumns = existingValues.map(
      (value) => `${valueToPercent(value, min, max)}%`,
    )
    if (newValue > 0)
      gridTemplateColumns.push(
        `minmax(auto, ${valueToPercent(newValue, min, max)}%)`,
      )
    return gridTemplateColumns.join(' ')
  }, [existingValues, newValue, min, max])

  const values = useMemo(() => {
    if (newValue > 0) return [...existingValues, newValue]
    return existingValues
  }, [existingValues, newValue])

  return (
    <Skeleton isLoaded={!isLoading}>
      <Stack aria-hidden mt="1.5rem" spacing="0.5rem">
        {isOverQuota ? (
          <>
            <Flex h="1rem">
              <FilledTrack bg="danger.500" />
            </Flex>
            <Flex justify="center" textStyle="caption-1" color="secondary.700">
              {totalAttachmentSize} / {max} MB
            </Flex>
          </>
        ) : (
          <>
            <Grid
              overflow="hidden"
              borderRadius="3px"
              h="1rem"
              bg="primary.300"
              gridTemplateColumns={gridTemplateColumns}
            >
              {barProps.map((props, i) => (
                <FilledTrack key={i} {...props} />
              ))}
            </Grid>
            <Grid
              gridTemplateColumns={gridTemplateColumns}
              textStyle="caption-1"
              color="secondary.700"
            >
              {values.map((value, i) =>
                value ? (
                  <Flex key={i} justify="center">
                    {value} MB
                  </Flex>
                ) : (
                  <Box key={i} />
                ),
              )}
            </Grid>
          </>
        )}
      </Stack>
    </Skeleton>
  )
}
