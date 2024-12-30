import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BiSearch } from 'react-icons/bi'
import {
  Box,
  Divider,
  Flex,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from '@chakra-ui/react'

import { Tab } from '~components/Tabs'

import { useCreatePageSidebar } from '~features/admin-form/create/common/CreatePageSidebarContext'
import { useUser } from '~features/user/queries'

import { useCreateTabForm } from '../../../builder-and-design/useCreateTabForm'
import { CreatePageDrawerCloseButton } from '../../../common'
import { FieldListTabIndex } from '../../constants'

import {
  BasicFieldPanel,
  MyInfoFieldPanel,
  PaymentsInputPanel,
} from './field-panels'
import { MagicFormBuilderContainer } from './MagicFormBuilderContainer'

const FieldSearchBar = ({
  searchValue,
  onChange,
}: {
  searchValue: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
}) => {
  // TODO (MFB-v1.1): Remove useUser and isTest which is used for beta flag when out of beta
  const { user } = useUser()
  const isTest = import.meta.env.STORYBOOK_NODE_ENV === 'test'

  return (
    <>
      <InputGroup>
        <InputLeftElement>
          <Icon as={BiSearch} color="secondary.500" fontSize="1.25rem" />
        </InputLeftElement>
        <Input
          mr="0.5rem"
          value={searchValue}
          onChange={onChange}
          placeholder="Search fields"
        />
        {/* TODO (MFB-v1.1): Remove this beta flag and isTest check when out of beta*/}
        {user?.betaFlags?.mfb || isTest ? <MagicFormBuilderContainer /> : null}
      </InputGroup>
    </>
  )
}

export const FieldListDrawer = (): JSX.Element => {
  const { t } = useTranslation()
  const { fieldListTabIndex, setFieldListTabIndex } = useCreatePageSidebar()
  const { isLoading } = useCreateTabForm()
  const [searchValue, setSearchValue] = useState('')

  const tabsDataList = [
    {
      header: 'Basic',
      component: BasicFieldPanel,
      isHidden: false,
      isDisabled: isLoading,
      key: FieldListTabIndex.Basic,
    },
    {
      header: 'MyInfo',
      component: MyInfoFieldPanel,
      isHidden: false,
      isDisabled: isLoading,
      key: FieldListTabIndex.MyInfo,
    },
    {
      header: 'Payments',
      component: PaymentsInputPanel,
      isHidden: false,
      isDisabled: isLoading,
      key: FieldListTabIndex.Payments,
    },
  ].filter((tab) => !tab.isHidden) as {
    header: string
    component: (props: { searchValue?: string }) => JSX.Element
    isDisabled: boolean
    key: FieldListTabIndex
  }[]

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
            {t('features.adminForm.sidebar.fields.builder.title')}
          </Text>
          <CreatePageDrawerCloseButton />
        </Flex>
        <FieldSearchBar
          searchValue={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
        />
        <TabList mt="0.5rem" mx="-0.25rem" w="100%">
          {tabsDataList.map((tab) => (
            <Tab key={tab.key} isDisabled={tab.isDisabled}>
              {tab.header}
            </Tab>
          ))}
        </TabList>
        <Divider w="auto" mx="-1.5rem" />
      </Box>
      <TabPanels pb="1rem" flex={1} overflowY="auto">
        {tabsDataList.map((tab) => (
          <TabPanel key={tab.key}>
            <tab.component searchValue={searchValue} />
          </TabPanel>
        ))}
      </TabPanels>
    </Tabs>
  )
}
