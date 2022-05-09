import { useMemo } from 'react'
import { Box, BoxProps, Flex, Grid, Skeleton, Stack } from '@chakra-ui/react'
import { valueToPercent } from '@chakra-ui/utils'

export interface AttachmentStackedBarProps {
  /** Values to render in the stacked bar. If `undefined` the progress bar will be in the loading state */
  values?: number[]
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
  min = 0,
  max,
  values,
}: AttachmentStackedBarProps): JSX.Element => {
  const isOverQuota = useMemo(
    () => !!values && max < values.reduce((sum, v) => sum + v, 0),
    [max, values],
  )

  const barProps = useMemo(() => {
    return [
      { bg: 'warning.500' },
      {
        bg: isOverQuota ? 'danger.500' : 'success.500',
        border: isOverQuota
          ? undefined
          : '1px dashed var(--chakra-colors-success-800)',
      },
    ]
  }, [isOverQuota])

  const gridTemplateColumns = useMemo(() => {
    return [
      `${valueToPercent(values?.[0] ?? 0, min, max)}%`,
      `minmax(auto, ${valueToPercent(values?.[1] ?? 0, min, max)}%)`,
    ].join(' ')
  }, [max, min, values])

  return (
    <Skeleton isLoaded={!!values}>
      <Stack aria-hidden mt="1.5rem" spacing="0.5rem">
        <Grid
          overflow="hidden"
          borderRadius="3px"
          h="1rem"
          bg="primary.300"
          gridTemplateColumns={gridTemplateColumns}
        >
          {values?.map((value, i) => (
            <FilledTrack {...barProps[i]} />
          ))}
        </Grid>
        {values ? (
          <Grid
            gridTemplateColumns={gridTemplateColumns}
            textStyle="caption-1"
            color="secondary.700"
          >
            {values.map((value) =>
              value ? <Flex justify="center">{value} MB</Flex> : <Box />,
            )}
          </Grid>
        ) : null}
      </Stack>
    </Skeleton>
  )
}
