import { useMemo } from 'react'
import {
  Box,
  ButtonProps,
  Center,
  chakra,
  Flex,
  forwardRef,
  Icon,
  Text,
} from '@chakra-ui/react'

import { FormResponseMode } from '~shared/types'

import { BxsWidget } from '~assets/icons/BxsWidget'
import { useIsMobile } from '~hooks/useIsMobile'

import { useAdminForm } from '~features/admin-form/common/queries'
import { useUser } from '~features/user/queries'

import { MagicFormButton } from './MagicFormButton'

const OrDivider = ({ isMobile }: { isMobile: boolean }) => (
  <Flex
    width="100%"
    maxW={isMobile ? '12rem' : '18rem'}
    flexDir="row"
    alignItems="center"
    justifyContent="space-around"
    verticalAlign="middle"
  >
    <Box flexGrow={1} height="1px" bgColor="black" />
    <Text
      textStyle="subhead-2"
      color="secondary.500"
      px="1.5rem"
      textAlign={'center'}
    >
      OR
    </Text>
    <Box flexGrow={1} height="1px" bgColor="black" />
  </Flex>
)

interface EmptyFormPlaceholderProps extends ButtonProps {
  isDraggingOver: boolean
  onClick: () => void
  onMagicFormButtonClick: () => void
}

export const EmptyFormPlaceholder = forwardRef<
  EmptyFormPlaceholderProps,
  'button'
>(
  (
    { isDraggingOver, onClick, onMagicFormButtonClick, ...props },
    ref,
  ): JSX.Element => {
    // TODO: (MFB) Remove isTest check when MFB is out of beta
    const isTest = import.meta.env.STORYBOOK_NODE_ENV === 'test'
    const isMobile = useIsMobile()
    const { user } = useUser()
    const { data: form } = useAdminForm()
    const isStorageMode = form?.responseMode === FormResponseMode.Encrypt
    // TODO: (MFB) Remove isTest check when MFB is out of beta
    const isMagicFormBuilderEnabled =
      isStorageMode && (isTest || user?.betaFlags?.mfb)

    const placeholderText = useMemo(() => {
      if (isDraggingOver) {
        return 'Drop your field here'
      }
      return isMobile
        ? 'Tap here to add a field'
        : 'Drag a field from the Builder on the left to start'
    }, [isDraggingOver, isMobile])

    return (
      <Box position="relative" h="13.75rem" m={{ base: 0, lg: '1.625rem' }}>
        <chakra.button
          _hover={{
            bg: 'primary.200',
          }}
          _focus={{
            boxShadow: '0 0 0 2px var(--chakra-colors-neutral-500)',
          }}
          h="100%"
          w="100%"
          border="1px dashed"
          borderColor={isDraggingOver ? 'primary.700' : 'secondary.300'}
          borderRadius="4px"
          bg="neutral.100"
          transitionProperty="common"
          transitionDuration="normal"
          onClick={onClick}
          {...props}
          ref={ref}
        >
          <Center flexDir="column" gap={'0.75rem'}>
            <Icon
              as={BxsWidget}
              __css={{ color: 'secondary.500', fontSize: '1.5rem' }}
            />
            <Text
              textStyle="subhead-2"
              color="secondary.500"
              px="1.5rem"
              textAlign={'center'}
            >
              {placeholderText}
            </Text>
            {isMagicFormBuilderEnabled ? (
              <>
                <OrDivider isMobile={isMobile} />
                <Box h="2.75rem">Box</Box>
              </>
            ) : null}
          </Center>
        </chakra.button>
        {isMagicFormBuilderEnabled ? (
          <Box
            bottom="2.375rem"
            w="100%"
            px="2rem"
            position="absolute"
            display="flex"
            justifyContent="center"
          >
            <MagicFormButton onClick={onMagicFormButtonClick} />
          </Box>
        ) : null}
      </Box>
    )
  },
)
