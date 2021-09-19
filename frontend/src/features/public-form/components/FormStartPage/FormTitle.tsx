import { useMemo } from 'react'
import { Flex, Icon, Skeleton, Text } from '@chakra-ui/react'
import simplur from 'simplur'

import { FormColorTheme } from '~shared/types/form/form'

import { BxsTimeFive } from '~assets/icons/BxsTimeFive'

import { usePublicForm } from '~features/public-form/queries'

export const FormTitle = (): JSX.Element => {
  const { data, isLoading } = usePublicForm()

  const titleColour = useMemo(() => {
    if (data?.startPage.colorTheme === FormColorTheme.Orange) {
      return 'secondary.700'
    }
    return 'white'
  }, [data?.startPage.colorTheme])

  const estTimeString = useMemo(() => {
    if (!data || !data.startPage.estTimeTaken) return ''
    return simplur`${data.startPage.estTimeTaken} min[|s] estimated time to complete`
  }, [data])

  return (
    <Flex
      p="3rem"
      justify="center"
      bg={data ? `theme-${data.startPage.colorTheme}.500` : undefined}
    >
      <Flex maxW="32.5rem" flexDir="column" align="center" color={titleColour}>
        <Skeleton isLoaded={!isLoading}>
          <Text as="h1" textStyle="h1">
            {data?.title ?? 'Loading title'}
          </Text>
        </Skeleton>
        {estTimeString && (
          <Flex align="center" justify="center" mt="1rem">
            <Icon as={BxsTimeFive} fontSize="1.5rem" mr="0.5rem" />
            <Text textStyle="body-2">{estTimeString}</Text>
          </Flex>
        )}
      </Flex>
    </Flex>
  )
}
