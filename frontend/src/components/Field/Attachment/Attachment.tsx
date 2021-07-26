import {
  Button,
  ButtonProps,
  Center,
  Icon,
  Text,
  useMultiStyleConfig,
  VStack,
} from '@chakra-ui/react'

import { BxsCloudUpload } from '~assets/icons'
// check if whole area clickable or just link (should be link)
// A: whole area is clickable
// no special stuff for disabled
// for error, everything is as per normal
// we do use the base form blahblah components
export const Attachment = (props: ButtonProps): JSX.Element => {
  const styles = useMultiStyleConfig('Attachment', props)
  return (
    <Button
      sx={styles.container}
      data-js-focus-visible
      data-focus-visible-added
      {...props}
    >
      <Center>
        <VStack spacing="0.5rem">
          <Icon as={BxsCloudUpload} sx={styles.icon} />
          {/* double check if the 500 is actually intended */}
          <Text textStyle="body-1" fontWeight={500}>
            <Text as="u" sx={styles.text}>
              Choose file
            </Text>
            &nbsp;or drag and drop here
          </Text>
        </VStack>
      </Center>
    </Button>
  )
}

// Check with designers if this is actually form label/form field message etc
export const AttachmentLabel = () => <div />
export const AttachmentSubtext = () => <div />
