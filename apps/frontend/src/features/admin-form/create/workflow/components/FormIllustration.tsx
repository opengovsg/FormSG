import { Box, Flex, Image, Stack, Text } from '@chakra-ui/react'

import formSgLogo from '~/assets/svgs/brand/brand-hort-colour.svg'

const ILLUSTRATED_FORM_TITLE = 'My form'

const SkeletonLine = ({ w }: { w: string }) => (
  <Box bg="secondary.200" borderRadius="3px" w={w} h="0.5rem" flexShrink={0} />
)

const SkeletonField = ({ labelWidth }: { labelWidth: string }) => (
  <Stack spacing="0.5rem">
    <SkeletonLine w={labelWidth} />
    <Box
      bg="white"
      border="1px solid"
      borderColor="neutral.300"
      borderRadius="4px"
      h="2.25rem"
    />
  </Stack>
)

export const FormIllustration = (): JSX.Element => (
  <Box w="100%" maxW="25rem">
    <Stack spacing={0} w="100%">
      <Flex
        justify="center"
        align="center"
        py="1rem"
        bg="white"
        borderTopRadius="8px"
        borderX="1px solid"
        borderTop="1px solid"
        borderColor="neutral.300"
      >
        <Image src={formSgLogo} alt="FormSG" h="1.75rem" />
      </Flex>

      <Flex
        bg="primary.500"
        justify="center"
        align="center"
        py="1.5rem"
        px="1.5rem"
        borderX="1px solid"
        borderColor="primary.500"
      >
        <Text textStyle="subhead-1" color="white" noOfLines={1}>
          {ILLUSTRATED_FORM_TITLE}
        </Text>
      </Flex>

      <Box
        bg="primary.100"
        px="1.25rem"
        py="1.25rem"
        borderX="1px solid"
        borderBottom="1px solid"
        borderColor="neutral.300"
        borderBottomRadius="8px"
        position="relative"
      >
        <Box bg="white" borderRadius="4px" px="1.25rem" py="1.25rem">
          <Stack spacing="1.25rem">
            <SkeletonField labelWidth="25%" />
            <SkeletonField labelWidth="40%" />
            <SkeletonField labelWidth="20%" />
          </Stack>
        </Box>

        <Box
          position="absolute"
          bottom={0}
          left={0}
          right={0}
          h="3rem"
          bgGradient="linear(to-b, transparent, primary.100)"
          borderBottomRadius="8px"
        />
      </Box>
    </Stack>
  </Box>
)
