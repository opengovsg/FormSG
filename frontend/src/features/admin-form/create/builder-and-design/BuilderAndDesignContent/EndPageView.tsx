import { useMemo } from 'react'
import { Box, Flex, FlexProps, Image, Stack, Text } from '@chakra-ui/react'
import { format } from 'date-fns'

import { BxsChevronUp } from '~assets/icons/BxsChevronUp'
import Button from '~components/Button'

import { useAdminForm } from '~features/admin-form/common/queries'
import { ThankYouSvgr } from '~features/public-form/components/FormEndPage/components/ThankYouSvgr'

import {
  endPageDataSelector,
  useEndPageBuilderStore,
} from '../useEndPageBuilderStore'

export const EndPageView = ({ ...props }: FlexProps): JSX.Element => {
  const { data: form } = useAdminForm()
  const endPageFromStore = useEndPageBuilderStore(endPageDataSelector)

  // When drawer is opened, store is populated. We always want the drawer settings
  // to be previewed, so when the store is populated, prioritize that setting.
  const endPage = useMemo(
    () => (endPageFromStore ? endPageFromStore : form?.endPage),
    [endPageFromStore, form?.endPage],
  )
  return (
    <Flex
      m={{ base: 0, md: '2rem' }}
      mb={0}
      flex={1}
      bg="white"
      p={{ base: '1.5rem', md: 0 }}
      justify="center"
      overflow="auto"
      {...props}
    >
      <Stack w="100%">
        <Flex justifyContent="center" pt="1rem" pb="0.5rem">
          <Image src={form?.admin?.agency?.logo} h="4rem" />
        </Flex>
        <Flex backgroundColor="primary.100" justifyContent="center">
          <ThankYouSvgr h="100%" pt="2.5rem" />
        </Flex>

        <Box px="4rem" pt="3rem">
          <Flex justifyContent="space-between" alignItems="center">
            <Text textStyle="h2" color="secondary.500">
              {endPage?.title}
            </Text>
            <BxsChevronUp color="secondary.500" />
          </Flex>

          <Text textStyle="subhead-1" color="secondary.500" mt="1rem">
            {endPage?.paragraph}
          </Text>

          <Text textStyle="subhead-1" color="secondary.500" mt="2.25rem">
            {form?.title ?? 'Form Title'}
          </Text>
          <Text textStyle="body-1" color="neutral.500">
            {form?._id ?? 'Form Identification Number'}
            <br />
            {format(new Date(), 'dd MMM yyyy, h:m aa')}
          </Text>

          <Flex pt="1.75rem" gap="2rem">
            <Button>Save this response</Button>
            <Button variant="clear">{endPage?.buttonText}</Button>
          </Flex>
        </Box>
      </Stack>
    </Flex>
  )
}
