import { useTranslation } from 'react-i18next'
import { Divider, Flex, Text } from '@chakra-ui/react'

export const EditConditionBlockDivider = (): JSX.Element => {
  const { t } = useTranslation()
  return (
    <Flex w="100%" my="2rem">
      <Divider
        alignSelf="center"
        ml={{ base: '-1.5rem', md: '-2rem' }}
        pr={{ base: '1.5rem', md: '2rem' }}
      />
      <Text
        p="0.625rem"
        textStyle="subhead-3"
        textTransform="uppercase"
        color="secondary.500"
      >
        {t('features.adminForm.sidebar.logic.conjunctive')}
      </Text>
      <Divider
        alignSelf="center"
        mr={{ base: '-1.5rem', md: '-2rem' }}
        pl={{ base: '1.5rem', md: '2rem' }}
      />
    </Flex>
  )
}
