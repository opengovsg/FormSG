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

import { Tab } from '~components/Tabs'

import { useAdminForm } from '~features/admin-form/common/queries'

import { BuilderDrawerCloseButton } from '../FieldRow/BuilderDrawerCloseButton'

import { ALL_FIELDS_ORDERED } from './constants'
import { DraggableCreateFieldOption } from './CreateFieldOption'

export const CreateFieldDrawer = (): JSX.Element => {
  const { isLoading } = useAdminForm()

  return (
    <Tabs pos="relative" h="100%" display="flex" flexDir="column">
      <Box pt="1rem" px="1.5rem" bg="white">
        <Flex justify="space-between">
          <Text textStyle="subhead-3" color="secondary.500" mb="1rem">
            Builder
          </Text>
          <BuilderDrawerCloseButton />
        </Flex>
        <TabList mx="-1rem" w="100%">
          <Tab isDisabled={isLoading}>Basic</Tab>
          <Tab isDisabled={isLoading}>MyInfo</Tab>
        </TabList>
        <Divider w="auto" mx="-1.5rem" />
      </Box>
      <TabPanels pb="1rem" flex={1} overflowY="auto">
        <TabPanel>
          <BasicFieldPanelContent />
        </TabPanel>
        <TabPanel>MyInfo</TabPanel>
      </TabPanels>
    </Tabs>
  )
}

const BasicFieldPanelContent = () => {
  const { isLoading } = useAdminForm()

  const pageFieldOptions = useMemo(() => ALL_FIELDS_ORDERED.slice(0, 3), [])
  const fieldFieldOptions = useMemo(() => ALL_FIELDS_ORDERED.slice(3), [])

  return (
    <>
      <Droppable isDropDisabled droppableId="create-fields-page">
        {(provided) => (
          <Box ref={provided.innerRef} {...provided.droppableProps}>
            <FieldSection label="Page">
              {pageFieldOptions.map((fieldType, index) => (
                <DraggableCreateFieldOption
                  index={index}
                  isDisabled={isLoading}
                  key={index}
                  fieldType={fieldType}
                />
              ))}
            </FieldSection>
            <Box display="none">{provided.placeholder}</Box>
          </Box>
        )}
      </Droppable>
      <Droppable isDropDisabled droppableId="create-fields-fields">
        {(provided) => (
          <Box ref={provided.innerRef} {...provided.droppableProps}>
            <FieldSection label="Fields">
              {fieldFieldOptions.map((fieldType, index) => (
                <DraggableCreateFieldOption
                  index={index}
                  isDisabled={isLoading}
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

const FieldSection = ({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) => {
  return (
    <Box mb="0.5rem">
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
      <Stack divider={<StackDivider />} spacing={0}>
        {children}
      </Stack>
    </Box>
  )
}
