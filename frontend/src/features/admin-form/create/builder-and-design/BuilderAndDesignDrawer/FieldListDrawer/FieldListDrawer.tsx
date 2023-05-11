import {
  Box,
  Divider,
  Flex,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from '@chakra-ui/react'

import { featureFlags } from '~shared/constants'

import { Tab } from '~components/Tabs'

import { useCreatePageSidebar } from '~features/admin-form/create/common/CreatePageSidebarContext'
import { useFeatureFlags } from '~features/feature-flags/queries'
import { useUser } from '~features/user/queries'

import { useCreateTabForm } from '../../../builder-and-design/useCreateTabForm'
import { CreatePageDrawerCloseButton } from '../../../common'

import {
  BasicFieldPanel,
  MyInfoFieldPanel,
  PaymentsInputPanel,
} from './field-panels'

export const FieldListDrawer = (): JSX.Element => {
  const { fieldListTabIndex, setFieldListTabIndex } = useCreatePageSidebar()
  const { isLoading } = useCreateTabForm()

  const { user } = useUser()
  const { data: flags } = useFeatureFlags()

  const displayPayments =
    user?.betaFlags?.payment || flags?.has(featureFlags.payment)

  return (
    <Tabs
      pos="relative"
      h="100%"
      display="flex"
      flexDir="column"
      index={fieldListTabIndex}
      onChange={setFieldListTabIndex}
      isLazy
    >
      <Box pt="1rem" px="1.5rem" bg="white">
        <Flex justify="space-between">
          <Text textStyle="subhead-3" color="secondary.500" mb="1rem">
            Fields
          </Text>
          <CreatePageDrawerCloseButton />
        </Flex>
        <TabList mx="-0.25rem" w="100%">
          <Tab isDisabled={isLoading}>Basic</Tab>
          <Tab isDisabled={isLoading}>MyInfo</Tab>
          {displayPayments && <Tab isDisabled={isLoading}>Payments</Tab>}
        </TabList>
        <Divider w="auto" mx="-1.5rem" />
      </Box>
      <TabPanels pb="1rem" flex={1} overflowY="auto">
        <TabPanel>
          <BasicFieldPanel />
        </TabPanel>
        <TabPanel>
          <MyInfoFieldPanel />
        </TabPanel>
        {displayPayments && (
          <TabPanel>
            <PaymentsInputPanel />
          </TabPanel>
        )}
      </TabPanels>
    </Tabs>
  )
}
