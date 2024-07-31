import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { BiPlus } from 'react-icons/bi'
import { Divider, Flex, Grid, Icon, Stack, Text } from '@chakra-ui/react'

import { GUIDE_FORM_LOGIC } from '~constants/links'
import Button from '~components/Button'
import Link from '~components/Link'

import { useAdminLogicStore } from '../adminLogicStore'
import { ALLOWED_FIELDS_META } from '../constants'

import { LogicSvgr } from './LogicSvgr'

export const EmptyLogic = (): JSX.Element => {
  const { t } = useTranslation()
  const setToCreating = useAdminLogicStore(
    useCallback((state) => state.setToCreating, []),
  )

  return (
    <Flex
      textAlign="center"
      flexDir="column"
      align="center"
      color="secondary.500"
      pt={{ base: '0.5rem', md: '2.75rem' }}
    >
      <Text textStyle="h2" as="h2">
        {t('features.adminForm.sidebar.logic.title')}
      </Text>
      <Text textStyle="body-1" mt="1rem">
        {t('features.adminForm.sidebar.logic.helperText')}{' '}
        <Link isExternal href={GUIDE_FORM_LOGIC}>
          {t('features.adminForm.sidebar.logic.helperTextCta')}
        </Link>
      </Text>
      <Button
        my="2.5rem"
        leftIcon={<BiPlus fontSize="1.5rem" />}
        onClick={setToCreating}
      >
        {t('features.adminForm.sidebar.logic.addLogicBtn')}
      </Button>
      <LogicSvgr maxW="292px" />
      <Divider my="2.5rem" />
      <Stack spacing="1.5rem" textAlign="center" maxW="28rem">
        <Text textStyle="subhead-3">
          {t('features.adminForm.sidebar.logic.allowedFields')}
        </Text>
        <Flex>
          <Grid
            columnGap="3.5rem"
            rowGap="1rem"
            templateColumns={{
              base: 'repeat(2, minmax(20%, min-content))',
              md: 'repeat(3, minmax(0, min-content))',
            }}
          >
            {ALLOWED_FIELDS_META.map(({ icon, label }) => (
              <Stack key={label} direction="row" align="center">
                <Icon fontSize="1rem" as={icon} />
                <Text textStyle="body-2">{label}</Text>
              </Stack>
            ))}
          </Grid>
        </Flex>
      </Stack>
    </Flex>
  )
}
