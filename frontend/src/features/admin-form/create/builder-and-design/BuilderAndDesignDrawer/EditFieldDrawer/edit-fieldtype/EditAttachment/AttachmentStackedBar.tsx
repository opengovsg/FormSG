import { useMemo } from 'react'
import { Box, BoxProps, Flex, Grid, Skeleton, Stack } from '@chakra-ui/react'
import { valueToPercent } from '@chakra-ui/utils'

export interface AttachmentStackedBarProps {
  /** Existing value to render in the stacked bar. If `undefined` the progress
   * bar will be in the loading state. */
  existingValue?: number
  /** The new value to add into the stacked bar. If `undefined`, will not be
   * displayed. */
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
  existingValue: existingValueProp,
  newValue = 0,
  min = 0,
  max,
}: AttachmentStackedBarProps): JSX.Element => {
  const isLoading = useMemo(
    () => existingValueProp === undefined,
    [existingValueProp],
  )

  const existingValue = useMemo(
    () => existingValueProp ?? 0,
    [existingValueProp],
  )

  const totalAttachmentSize = useMemo(
    () => existingValue + newValue,
    [existingValue, newValue],
  )

  const isOverQuota = useMemo(
    () => max < totalAttachmentSize,
    [max, totalAttachmentSize],
  )

  const barProps = useMemo(() => {
    const barProps = []
    if (existingValue) {
      barProps.push({
        bg: 'interaction.warning.default',
        border: 'none',
      })
    }
    if (newValue) {
      barProps.push({
        bg: 'interaction.success.default',
        border: '1px dashed var(--chakra-colors-interaction-success-active)',
      })
    }
    return barProps
  }, [existingValue, newValue])

  const gridTemplateColumns = useMemo(() => {
    const gridTemplateColumns = []
    if (existingValue) {
      gridTemplateColumns.push(`${valueToPercent(existingValue, min, max)}%`)
    }
    if (newValue) {
      gridTemplateColumns.push(
        `minmax(auto, ${valueToPercent(newValue, min, max)}%)`,
      )
    }
    return gridTemplateColumns.join(' ')
  }, [existingValue, newValue, min, max])

  const valueLabels = useMemo(() => {
    const valueLabels = []
    if (existingValue) valueLabels.push('Used')
    if (newValue) valueLabels.push(`${newValue} MB`)
    return valueLabels
  }, [existingValue, newValue])

  return (
    <Skeleton isLoaded={!isLoading}>
      <Stack aria-hidden mt="1.5rem" spacing="0.5rem">
        {isOverQuota ? (
          <>
            <Flex h="1rem">
              <FilledTrack bg="interaction.critical.default" />
            </Flex>
            <Flex
              justify="center"
              textStyle="caption-1"
              color="brand.secondary.700"
            >
              {totalAttachmentSize} / {max} MB
            </Flex>
          </>
        ) : (
          <>
            <Grid
              overflow="hidden"
              borderRadius="3px"
              h="1rem"
              bg="brand.primary.300"
              gridTemplateColumns={gridTemplateColumns}
            >
              {barProps.map((props, i) => (
                <FilledTrack key={i} {...props} />
              ))}
            </Grid>
            <Grid
              gridTemplateColumns={gridTemplateColumns}
              textStyle="caption-1"
              color="brand.secondary.700"
            >
              {valueLabels.map((value, i) => (
                <Flex key={i} justify="center">
                  {value}
                </Flex>
              ))}
            </Grid>
          </>
        )}
      </Stack>
    </Skeleton>
  )
}
