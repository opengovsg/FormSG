import { useCallback, useMemo } from 'react'
import { BiLeftArrowAlt, BiShow, BiUserPlus } from 'react-icons/bi'
import { useHistory, useParams } from 'react-router-dom'
import { ButtonGroup, Flex, Skeleton, Text } from '@chakra-ui/react'
import format from 'date-fns/format'

import { AdminFormDto } from '~shared/types/form/form'

import { ROOT_ROUTE } from '~constants/routes'
import Button from '~components/Button'
import IconButton from '~components/IconButton'
import { TabList } from '~components/Tabs'
import { Tab } from '~components/Tabs/Tab'

import { useAdminForm } from '../queries'

const FormNavbarDetails = ({ form }: { form?: AdminFormDto }) => {
  const readableLastModified = useMemo(() => {
    if (!form) return 'Date is still loading...'
    const formattedDate = format(
      new Date(form.lastModified),
      'h:mm a, dd LLL y',
    )
    return `Saved at ${formattedDate}`
  }, [form])

  return (
    <Flex align="flex-start" flexDir="column" justify="center">
      <Skeleton isLoaded={!!form}>
        <Text textStyle="body-1" color="secondary.500">
          {form?.title ?? 'Form title loading...'}
        </Text>
      </Skeleton>

      <Skeleton isLoaded={!!form}>
        <Text textStyle="legal" textTransform="uppercase" color="neutral.700">
          {readableLastModified}
        </Text>
      </Skeleton>
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
          mr="0.5rem"
          aria-label="Go back to dashboard"
          variant="clear"
          colorScheme="secondary"
          onClick={handleBackToDashboard}
          icon={<BiLeftArrowAlt />}
        />
        <FormNavbarDetails form={form} />
      </Flex>
      <TabList mt="-1.125rem" mb="-0.25rem" borderBottom="none">
        <Tab isDisabled={!form}>Create</Tab>
        <Tab isDisabled={!form}>Settings</Tab>
        <Tab isDisabled={!form}>Results</Tab>
      </TabList>
      <ButtonGroup
        spacing="0.5rem"
        flex={1}
        justifyContent="flex-end"
        isDisabled={!form}
      >
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
