import { useCallback, useMemo } from 'react'
import { BiLeftArrowAlt, BiShow, BiUserPlus } from 'react-icons/bi'
import { useHistory, useParams } from 'react-router-dom'
import { ButtonGroup, Flex, Skeleton, Stack, Text } from '@chakra-ui/react'
import format from 'date-fns/format'

import { AdminFormDto } from '~shared/types/form/form'

import { ROOT_ROUTE } from '~constants/routes'
import Button from '~components/Button'
import IconButton from '~components/IconButton'
import { TabList } from '~components/Tabs'
import { Tab } from '~components/Tabs/Tab'
import Skeletonable from '~templates/Skeletonable'

import { useAdminForm } from '../queries'

const FormNavbarDetailsSkeleton = () => {
  return (
    <Stack w="12rem" maxW="100%">
      <Skeleton height="1.5rem" />
      <Skeleton height="0.75rem" />
    </Stack>
  )
}

const FormNavbarDetails = ({ form }: { form: AdminFormDto }) => {
  const readableLastModified = useMemo(() => {
    const formattedDate = format(
      new Date(form.lastModified),
      'h:mm a, dd LLL y',
    )
    return `Saved at ${formattedDate}`
  }, [form])

  return (
    <Flex ml="0.5rem" align="flex-start" flexDir="column" justify="center">
      <Text textStyle="body-1" color="secondary.500">
        {form.title}
      </Text>
      <Text textStyle="legal" textTransform="uppercase" color="neutral.700">
        {readableLastModified}
      </Text>
    </Flex>
  )
}

/**
 * @precondition Must have AdminFormTabProvider parent due to usage of TabList and Tab.
 */
export const AdminFormNavbar = (): JSX.Element => {
  const { formId } = useParams<{ formId: string }>()
  const { data: form } = useAdminForm(formId)

  const history = useHistory()

  const handleBackToDashboard = useCallback((): void => {
    history.push(ROOT_ROUTE)
  }, [history])

  return (
    <Flex py="0.625rem" px="2rem" justify="space-between" align="center">
      <Flex flex={1}>
        <IconButton
          aria-label="Go back to dashboard"
          variant="clear"
          colorScheme="secondary"
          onClick={handleBackToDashboard}
          icon={<BiLeftArrowAlt />}
        />
        <Skeletonable skeleton={<FormNavbarDetailsSkeleton />}>
          {form && <FormNavbarDetails form={form} />}
        </Skeletonable>
      </Flex>
      <TabList mt="-1.125rem" mb="-0.25rem" borderBottom="none">
        <Tab>Create</Tab>
        <Tab>Settings</Tab>
        <Tab>Results</Tab>
      </TabList>
      <ButtonGroup spacing="0.5rem" flex={1} justifyContent="flex-end">
        <IconButton
          aria-label="Add collaborators to form"
          variant="outline"
          // TODO(#2487): Add collaborator feature
          icon={<BiUserPlus />}
        />
        <IconButton
          aria-label="Preview form"
          variant="outline"
          // TODO: Add preview feature
          icon={<BiShow />}
        />
        <Button
        // TODO: Add share form feature (new?)
        >
          Share
        </Button>
      </ButtonGroup>
    </Flex>
  )
}
