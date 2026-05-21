import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BiRightArrowAlt, BiSearch } from 'react-icons/bi'
import {
  Box,
  Divider,
  Flex,
  Icon,
  Input,
  InputGroup,
  InputLeftElement,
  Progress,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from '@chakra-ui/react'
import { useFeatureIsOn } from '@growthbook/growthbook-react'

import { featureFlags } from 'formsg-shared/constants'

import { Tab } from '~components/Tabs'

import {
  DrawerTabs,
  useCreatePageSidebar,
} from '~features/admin-form/create/common/CreatePageSidebarContext'
import {
  completedPhases,
  stepsSelector,
  useWorkflowBuilderStore,
} from '~features/admin-form/create/workflow-v2/workflowBuilderStore'

import { useCreateTabForm } from '../../../builder-and-design/useCreateTabForm'
import { CreatePageDrawerCloseButton } from '../../../common'
import { FieldListTabIndex } from '../../constants'
import MagicFormBuilderSmallButton from '../../MagicFormBuilder/components/MagicFormBuilderSmallButton'
import { useMagicFormBuilder } from '../../MagicFormBuilder/useMagicFormBuilder'

import {
  BasicFieldPanel,
  MyInfoFieldPanel,
  PaymentsInputPanel,
} from './field-panels'

const FieldSearchBar = ({
  searchValue,
  onChange,
  placeholder,
}: {
  searchValue: string
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  placeholder: string
}) => {
  const { toggleIsModalOpen, isModalOpen } = useMagicFormBuilder()

  const isMfbTextEnabled = useFeatureIsOn(featureFlags.mfb)
  const isMfbVisionEnabled = useFeatureIsOn(featureFlags.mfbVision)

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
          placeholder={placeholder}
        />
        {(isMfbTextEnabled || isMfbVisionEnabled) && (
          <MagicFormBuilderSmallButton
            onClick={toggleIsModalOpen}
            isActive={isModalOpen}
          />
        )}
      </InputGroup>
    </>
  )
}

export const FieldListDrawer = (): JSX.Element => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.sidebar.fields',
  })
  const { fieldListTabIndex, setFieldListTabIndex, handleWorkflowClick } =
    useCreatePageSidebar()
  const { isLoading } = useCreateTabForm()
  const [searchValue, setSearchValue] = useState('')

  // Workflow progress card state
  const steps = useWorkflowBuilderStore(stepsSelector)
  const workflowStoreState = useWorkflowBuilderStore((s) => s)
  const hasWorkflow = steps.length > 1
  const completedCount = useMemo(
    () => (hasWorkflow ? completedPhases(workflowStoreState).length : 0),
    [hasWorkflow, workflowStoreState],
  )
  const showProgressCard = hasWorkflow && completedCount < 4

  const tabsDataList = [
    {
      header: t('builder.tabs.basic'),
      component: BasicFieldPanel,
      isHidden: false,
      isDisabled: isLoading,
      key: FieldListTabIndex.Basic,
    },
    {
      header: t('builder.tabs.myInfo'),
      component: MyInfoFieldPanel,
      isHidden: false,
      isDisabled: isLoading,
      key: FieldListTabIndex.MyInfo,
    },
    {
      header: t('builder.tabs.payments'),
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
            {t('builder.title')}
          </Text>
          <CreatePageDrawerCloseButton />
        </Flex>
        {showProgressCard && (
          <Box
            mb="0.75rem"
            p="0.75rem"
            borderRadius="8px"
            border="1px solid"
            borderColor="primary.300"
            bg="primary.100"
            cursor="pointer"
            _hover={{ borderColor: 'primary.500' }}
            transition="border-color 0.2s"
            onClick={() => handleWorkflowClick(false)}
          >
            <Flex justify="space-between" align="center">
              <Text textStyle="subhead-2" color="secondary.500">
                Continue setting up your workflow
              </Text>
              <Icon
                as={BiRightArrowAlt}
                color="primary.500"
                fontSize="1.25rem"
              />
            </Flex>
            <Progress
              value={(completedCount / 4) * 100}
              size="xs"
              colorScheme="primary"
              borderRadius="full"
              mt="0.5rem"
            />
          </Box>
        )}
        <FieldSearchBar
          searchValue={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder={t('builder.searchPlaceholder')}
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
