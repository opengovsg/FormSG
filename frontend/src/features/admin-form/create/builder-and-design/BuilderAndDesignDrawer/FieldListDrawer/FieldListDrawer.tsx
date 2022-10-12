import { useMemo } from 'react'
import { Droppable } from 'react-beautiful-dnd'
import {
  Box,
  Divider,
  Flex,
  Stack,
  StackDivider,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Text,
} from '@chakra-ui/react'

import { AdminFormDto, FormAuthType, FormResponseMode } from '~shared/types'

import { GUIDE_EMAIL_MODE } from '~constants/links'
import InlineMessage from '~components/InlineMessage'
import Link from '~components/Link'
import { Tab } from '~components/Tabs'

import {
  BASIC_FIELDS_ORDERED,
  CREATE_FIELD_DROP_ID,
  CREATE_MYINFO_CONTACT_DROP_ID,
  CREATE_MYINFO_CONTACT_FIELDS_ORDERED,
  CREATE_MYINFO_MARRIAGE_DROP_ID,
  CREATE_MYINFO_MARRIAGE_FIELDS_ORDERED,
  CREATE_MYINFO_PARTICULARS_DROP_ID,
  CREATE_MYINFO_PARTICULARS_FIELDS_ORDERED,
  CREATE_MYINFO_PERSONAL_DROP_ID,
  CREATE_MYINFO_PERSONAL_FIELDS_ORDERED,
} from '~features/admin-form/create/builder-and-design/constants'
import { useCreatePageSidebar } from '~features/admin-form/create/common/CreatePageSidebarContext'
import { isMyInfo } from '~features/myinfo/utils'

import { useCreateTabForm } from '../../../builder-and-design/useCreateTabForm'
import { CreatePageDrawerCloseButton } from '../../../common'

import {
  DraggableBasicFieldListOption,
  DraggableMyInfoFieldListOption,
} from './FieldListOption'

export const FieldListDrawer = (): JSX.Element => {
  const { fieldListTabIndex, setFieldListTabIndex } = useCreatePageSidebar()
  const { isLoading } = useCreateTabForm()

  return (
    <Tabs
      pos="relative"
      h="100%"
      display="flex"
      flexDir="column"
      index={fieldListTabIndex}
      onChange={setFieldListTabIndex}
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
        </TabList>
        <Divider w="auto" mx="-1.5rem" />
      </Box>
      <TabPanels pb="1rem" flex={1} overflowY="auto">
        <TabPanel>
          <BasicFieldPanelContent />
        </TabPanel>
        <TabPanel>
          <MyInfoFieldPanelContent />
        </TabPanel>
      </TabPanels>
    </Tabs>
  )
}

const BasicFieldPanelContent = () => {
  const { isLoading } = useCreateTabForm()

  return (
    <Droppable isDropDisabled droppableId={CREATE_FIELD_DROP_ID}>
      {(provided) => (
        <Box ref={provided.innerRef} {...provided.droppableProps}>
          <FieldSection>
            {BASIC_FIELDS_ORDERED.map((fieldType, index) => (
              <DraggableBasicFieldListOption
                index={index}
                isDisabled={isLoading}
                key={index}
                fieldType={fieldType}
              />
            ))}
            <Box display="none">{provided.placeholder}</Box>
          </FieldSection>
        </Box>
      )}
    </Droppable>
  )
}

const MyInfoFieldPanelContent = () => {
  const { data: form, isLoading } = useCreateTabForm()
  // myInfo should be disabled if
  // 1. form response mode is not email mode
  // 2. form auth type is not myInfo
  // 3. # of myInfo fields >= 30
  const isMyInfoDisabled = useMemo(
    () =>
      form?.responseMode !== FormResponseMode.Email ||
      form?.authType !== FormAuthType.MyInfo ||
      (form ? form.form_fields.filter(isMyInfo).length >= 30 : true),
    [form],
  )
  const isDisabled = isMyInfoDisabled || isLoading

  return (
    <>
      <MyInfoMessage />
      <Droppable isDropDisabled droppableId={CREATE_MYINFO_PERSONAL_DROP_ID}>
        {(provided) => (
          <Box ref={provided.innerRef} {...provided.droppableProps}>
            <FieldSection label="Personal">
              {CREATE_MYINFO_PERSONAL_FIELDS_ORDERED.map((fieldType, index) => (
                <DraggableMyInfoFieldListOption
                  index={index}
                  isDisabled={isDisabled}
                  key={index}
                  fieldType={fieldType}
                />
              ))}
            </FieldSection>
            <Box display="none">{provided.placeholder}</Box>
          </Box>
        )}
      </Droppable>
      <Droppable isDropDisabled droppableId={CREATE_MYINFO_CONTACT_DROP_ID}>
        {(provided) => (
          <Box ref={provided.innerRef} {...provided.droppableProps}>
            <FieldSection label="Contact">
              {CREATE_MYINFO_CONTACT_FIELDS_ORDERED.map((fieldType, index) => (
                <DraggableMyInfoFieldListOption
                  index={index}
                  isDisabled={isDisabled}
                  key={index}
                  fieldType={fieldType}
                />
              ))}
            </FieldSection>
            <Box display="none">{provided.placeholder}</Box>
          </Box>
        )}
      </Droppable>
      <Droppable isDropDisabled droppableId={CREATE_MYINFO_PARTICULARS_DROP_ID}>
        {(provided) => (
          <Box ref={provided.innerRef} {...provided.droppableProps}>
            <FieldSection label="Particulars">
              {CREATE_MYINFO_PARTICULARS_FIELDS_ORDERED.map(
                (fieldType, index) => (
                  <DraggableMyInfoFieldListOption
                    index={index}
                    isDisabled={isDisabled}
                    key={index}
                    fieldType={fieldType}
                  />
                ),
              )}
            </FieldSection>
            <Box display="none">{provided.placeholder}</Box>
          </Box>
        )}
      </Droppable>
      <Droppable isDropDisabled droppableId={CREATE_MYINFO_MARRIAGE_DROP_ID}>
        {(provided) => (
          <Box ref={provided.innerRef} {...provided.droppableProps}>
            <FieldSection label="Family (Marriage)">
              {CREATE_MYINFO_MARRIAGE_FIELDS_ORDERED.map((fieldType, index) => (
                <DraggableMyInfoFieldListOption
                  index={index}
                  isDisabled={isDisabled}
                  key={index}
                  fieldType={fieldType}
                />
              ))}
            </FieldSection>
            <Box display="none">{provided.placeholder}</Box>
          </Box>
        )}
      </Droppable>
    </>
  )
}

type MyInfoTextProps = Pick<
  AdminFormDto,
  'authType' | 'responseMode' | 'form_fields'
>

const MyInfoText = ({
  authType,
  responseMode,
  form_fields,
}: MyInfoTextProps): JSX.Element => {
  const isMyInfoDisabled = authType !== FormAuthType.MyInfo
  const numMyInfoFields = useMemo(
    () => form_fields.filter((ff) => isMyInfo(ff)).length,
    [form_fields],
  )

  if (responseMode !== FormResponseMode.Email) {
    return <Text>MyInfo fields are not available in Storage mode forms.</Text>
  }

  if (isMyInfoDisabled) {
    return (
      <Text>Enable MyInfo in the Settings tab to access these fields.</Text>
    )
  }

  return (
    <Text>
      {`Only 30 MyInfo fields are allowed in Email mode (${numMyInfoFields}/30).`}{' '}
      <Link isExternal href={GUIDE_EMAIL_MODE}>
        Learn more
      </Link>
    </Text>
  )
}

const MyInfoMessage = (): JSX.Element | null => {
  const { data: form } = useCreateTabForm()
  const numMyInfoFields = form?.form_fields.filter((ff) => isMyInfo(ff)).length
  const hasExceededLimit = useMemo(
    () => numMyInfoFields && numMyInfoFields >= 30,
    [numMyInfoFields],
  )

  return form ? (
    <Box px="1.5rem" pt="2rem" pb="1.5rem">
      <InlineMessage variant={hasExceededLimit ? 'error' : 'info'}>
        <MyInfoText {...form} />
      </InlineMessage>
    </Box>
  ) : null
}

const FieldSection = ({
  label,
  children,
}: {
  label?: string
  children: React.ReactNode
}) => {
  return (
    <Box mb="0.5rem">
      {label ? (
        <Text
          px="1.5rem"
          pt="1rem"
          pb="0.75rem"
          textStyle="subhead-2"
          color="secondary.500"
          pos="sticky"
          top={0}
          bg="white"
          zIndex="docked"
        >
          {label}
        </Text>
      ) : null}
      <Stack divider={<StackDivider />} spacing={0}>
        {children}
      </Stack>
    </Box>
  )
}
