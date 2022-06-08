import { Skeleton, Stack, Text } from '@chakra-ui/react'

interface StatsItemProps {
  stat?: number
  description: string
}

export const StatsItem = ({ stat, description }: StatsItemProps) => {
  return (
    <Stack>
      <Skeleton isLoaded={!!stat}>
        <Text textStyle="h2" color="primary.500">
          {stat?.toLocaleString() ?? '-'}
        </Text>
      </Skeleton>
      <Text textStyle="subhead-3" color="secondary.500">
        {description}
      </Text>
    </Stack>
  )
}
