import { FC, useCallback } from 'react'
import {
  Box,
  Container,
  Divider,
  Flex,
  Heading,
  Stack,
  Text,
  useTheme,
  Wrap,
  WrapItem,
} from '@chakra-ui/react'

export const Typography: FC = () => {
  const theme = useTheme()

  const prettyPrint = useCallback((theme: Record<string, string>) => {
    return (
      <Box display="grid" textStyle="body-2">
        {Object.entries(theme).map(([key, value]) => (
          <Box display="inline-flex" key={key}>
            <Text color="secondary.400">{key}:&nbsp;</Text>
            <Text>{value}</Text>
          </Box>
        ))}
      </Box>
    )
  }, [])

  return (
    <Container maxW="container.xl">
      <Heading
        mb="2rem"
        fontSize="4rem"
        letterSpacing="-0.022em"
        color="secondary.700"
      >
        Typography
      </Heading>
      <Flex
        borderRadius="10px"
        bg="primary.500"
        py="3.5rem"
        px="5rem"
        justify="space-between"
        color="white"
        align="center"
      >
        <Text textStyle="display-2">Inter</Text>
        <Box
          fontSize="2rem"
          lineHeight="2.5rem"
          fontWeight="300"
          letterSpacing="-0.017em"
          sx={{
            fontFeatureSettings: "'tnum' on, 'cv05' on",
          }}
        >
          <Text>ABCDEFGHIJKLMNOPQRSTUVWXYZ</Text>
          <Text>abcdefghijklmnopqrstuvwxyz</Text>
          <Text>1234567890?!()[]&#123;&#125;&*^%$#@~&lt;&gt;</Text>
        </Box>
      </Flex>
      <Divider my="2rem" />
      <Heading as="h2" textStyle="display-2" color="primary.500" mb="2.5rem">
        Styles
      </Heading>
      <Stack spacing="1.5rem">
        <Wrap justify="space-between">
          <WrapItem>
            <Box w="43rem" textStyle="display-1" color="secondary.700">
              <Text>Display 1</Text>
              <Text>Build forms in minutes.</Text>
            </Box>
          </WrapItem>
          <WrapItem>{prettyPrint(theme.textStyles['display-1'])}</WrapItem>
        </Wrap>
        <Wrap justify="space-between">
          <WrapItem>
            <Box w="43rem" textStyle="display-1-mobile" color="secondary.700">
              <Text>Display 1 mobile</Text>
              <Text>Build forms in minutes.</Text>
            </Box>
          </WrapItem>
          <WrapItem>
            {prettyPrint(theme.textStyles['display-1-mobile'])}
          </WrapItem>
        </Wrap>
        <Wrap justify="space-between">
          <WrapItem>
            <Box w="43rem" textStyle="display-2" color="secondary.700">
              <Text>Display 2</Text>
              <Text>Build government forms in minutes.</Text>
            </Box>
          </WrapItem>
          <WrapItem>{prettyPrint(theme.textStyles['display-2'])}</WrapItem>
        </Wrap>
        <Wrap justify="space-between">
          <WrapItem>
            <Box w="43rem" textStyle="display-2-mobile" color="secondary.700">
              <Text>Display 2 mobile</Text>
              <Text>Build government forms in minutes.</Text>
            </Box>
          </WrapItem>
          <WrapItem>
            {prettyPrint(theme.textStyles['display-2-mobile'])}
          </WrapItem>
        </Wrap>
        <Wrap justify="space-between">
          <WrapItem>
            <Box w="43rem" textStyle="h1" color="secondary.700">
              <Text>Heading 1</Text>
              <Text>Build forms in minutes.</Text>
            </Box>
          </WrapItem>
          <WrapItem>{prettyPrint(theme.textStyles['h1'])}</WrapItem>
        </Wrap>
        <Wrap justify="space-between">
          <WrapItem>
            <Box w="43rem" textStyle="h1-mobile" color="secondary.700">
              <Text>Heading 1 mobile</Text>
              <Text>Build government forms in minutes.</Text>
            </Box>
          </WrapItem>
          <WrapItem>{prettyPrint(theme.textStyles['h1-mobile'])}</WrapItem>
        </Wrap>
        <Wrap justify="space-between">
          <WrapItem>
            <Box w="43rem" textStyle="h2" color="secondary.700">
              <Text>Heading 2</Text>
              <Text>Build government forms in minutes.</Text>
            </Box>
          </WrapItem>
          <WrapItem>{prettyPrint(theme.textStyles['h2'])}</WrapItem>
        </Wrap>
        <Wrap justify="space-between">
          <WrapItem>
            <Box w="43rem" textStyle="h3" color="secondary.700">
              <Text>Heading 3</Text>
              <Text>Build government forms in minutes.</Text>
            </Box>
          </WrapItem>
          <WrapItem>{prettyPrint(theme.textStyles['h3'])}</WrapItem>
        </Wrap>
        <Wrap justify="space-between">
          <WrapItem>
            <Box w="43rem" textStyle="h4" color="secondary.700">
              <Text>Heading 4</Text>
              <Text>Build government forms in minutes.</Text>
            </Box>
          </WrapItem>
          <WrapItem>{prettyPrint(theme.textStyles['h4'])}</WrapItem>
        </Wrap>
        <Wrap justify="space-between">
          <WrapItem>
            <Box w="43rem" textStyle="subhead-1" color="secondary.700">
              <Text>Subhead 1</Text>
              <Text maxW="33rem">
                Sign up with your government email, and build your form in
                minutes. It's free and no approval is required. Together let's
                make the Singapore government paperless.
              </Text>
            </Box>
          </WrapItem>
          <WrapItem>{prettyPrint(theme.textStyles['subhead-1'])}</WrapItem>
        </Wrap>
        <Wrap justify="space-between">
          <WrapItem>
            <Box w="43rem" textStyle="subhead-2" color="secondary.700">
              <Text>Subhead 2</Text>
              <Text maxW="33rem">
                Sign up with your government email, and build your form in
                minutes. It's free and no approval is required. Together let's
                make the Singapore government paperless.
              </Text>
            </Box>
          </WrapItem>
          <WrapItem>{prettyPrint(theme.textStyles['subhead-2'])}</WrapItem>
        </Wrap>
        <Wrap justify="space-between">
          <WrapItem>
            <Box w="43rem" textStyle="subhead-3" color="secondary.700">
              <Text>Subhead 3</Text>
              <Text maxW="33rem">
                Sign up with your government email, and build your form in
                minutes. It's free and no approval is required. Together let's
                make the Singapore government paperless.
              </Text>
            </Box>
          </WrapItem>
          <WrapItem>{prettyPrint(theme.textStyles['subhead-3'])}</WrapItem>
        </Wrap>
        <Wrap justify="space-between">
          <WrapItem>
            <Box w="43rem" textStyle="body-1" color="secondary.700">
              <Text>Body 1</Text>
              <Text maxW="33rem">
                Sign up with your government email, and build your form in
                minutes. It's free and no approval is required. Together let's
                make the Singapore government paperless.
              </Text>
            </Box>
          </WrapItem>
          <WrapItem>{prettyPrint(theme.textStyles['body-1'])}</WrapItem>
        </Wrap>
        <Wrap justify="space-between">
          <WrapItem>
            <Box w="43rem" textStyle="body-2" color="secondary.700">
              <Text>Body 2</Text>
              <Text maxW="33rem">
                Sign up with your government email, and build your form in
                minutes. It's free and no approval is required. Together let's
                make the Singapore government paperless.
              </Text>
            </Box>
          </WrapItem>
          <WrapItem>{prettyPrint(theme.textStyles['body-2'])}</WrapItem>
        </Wrap>
        <Wrap justify="space-between">
          <WrapItem>
            <Box w="43rem" textStyle="caption-1" color="secondary.700">
              <Text>Caption 1</Text>
              <Text maxW="33rem">
                Sign up with your government email, and build your form in
                minutes. It's free and no approval is required. Together let's
                make the Singapore government paperless.
              </Text>
            </Box>
          </WrapItem>
          <WrapItem>{prettyPrint(theme.textStyles['caption-1'])}</WrapItem>
        </Wrap>
        <Wrap justify="space-between">
          <WrapItem>
            <Box w="43rem" textStyle="caption-2" color="secondary.700">
              <Text>Caption 2</Text>
              <Text maxW="33rem">
                Sign up with your government email, and build your form in
                minutes. It's free and no approval is required. Together let's
                make the Singapore government paperless.
              </Text>
            </Box>
          </WrapItem>
          <WrapItem>{prettyPrint(theme.textStyles['caption-2'])}</WrapItem>
        </Wrap>
        <Wrap justify="space-between">
          <WrapItem>
            <Box w="43rem" textStyle="legal" color="secondary.700">
              <Text>Legal</Text>
              <Text maxW="33rem">
                Sign up with your government email, and build your form in
                minutes. It's free and no approval is required. Together let's
                make the Singapore government paperless.
              </Text>
            </Box>
          </WrapItem>
          <WrapItem>{prettyPrint(theme.textStyles['legal'])}</WrapItem>
        </Wrap>
      </Stack>
    </Container>
  )
}
