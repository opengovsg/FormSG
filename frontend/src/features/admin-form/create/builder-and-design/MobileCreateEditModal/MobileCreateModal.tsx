import { useCallback } from 'react'
import {
  Divider,
  SimpleGrid,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
} from '@chakra-ui/react'

import { BasicField } from '~shared/types/field'

import { ALL_FIELDS_ORDERED } from '../constants'
import {
  updateCreateStateSelector,
  useBuilderAndDesignStore,
} from '../useBuilderAndDesignStore'
import { useCreateTabForm } from '../useCreateTabForm'
import { getFieldCreationMeta } from '../utils/fieldCreation'

import { MobileAddElement } from './MobileAddElement'

export const MobileCreateModalBody = (): JSX.Element => {
  const { isLoading, data: form } = useCreateTabForm()
  const updateCreateState = useBuilderAndDesignStore(updateCreateStateSelector)

  const createFieldClickHandler = useCallback(
    (fieldType: BasicField) => () => {
      const field = getFieldCreationMeta(fieldType)
      updateCreateState(field, form?.form_fields.length ?? 0)
    },
    [form?.form_fields.length, updateCreateState],
  )

  return (
    <Tabs pos="relative" h="100%" display="flex" flexDir="column">
      <TabList w="100%">
        <Tab isDisabled={isLoading} py="0" ml="-4px">
          Basic
        </Tab>
        <Tab isDisabled={isLoading} py="0">
          MyInfo
        </Tab>
      </TabList>
      <Divider w="auto" mx="-1.5rem" />
      <TabPanels pb="1rem" flex={1} overflowY="auto">
        <TabPanel>
          <SimpleGrid
            columns={3}
            w="100%"
            spacingY="2.5rem"
            spacingX="2rem"
            mt="1.75rem"
          >
            {ALL_FIELDS_ORDERED.map((fieldType) => (
              <MobileAddElement
                fieldType={fieldType}
                key={fieldType}
                onClick={createFieldClickHandler(fieldType)}
              />
            ))}
          </SimpleGrid>
        </TabPanel>
        <TabPanel>MyInfo</TabPanel>
      </TabPanels>
    </Tabs>
  )
}
