import { useDisclosure } from '@chakra-ui/hooks'
import {
  ButtonGroup,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  ModalProps,
} from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import Button from '~components/Button'

export default {
  title: 'Components/Modal',
  decorators: [],
} as Meta

type StoryModalProps = ModalProps & {
  bodyContent?: any
}

// Helper method to generate lorem text.
const generateLorem = (numParagraph = 1) => {
  const para =
    'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla gravida nisl sit amet hendrerit elementum. Phasellus et aliquet quam, nec ornare ex. Donec et luctus justo, id consectetur nisi. Nam non nunc ligula. Suspendisse potenti. Integer accumsan sem quis purus euismod, et tincidunt velit faucibus. Curabitur pharetra finibus nunc, sed finibus ex hendrerit eu. Cras elementum dui a imperdiet porttitor. Donec vulputate hendrerit quam, quis consectetur orci interdum ac. Cras porttitor arcu lacus.'
  let builtString = ''
  while (numParagraph-- > 0) {
    builtString += para + '\n\n'
  }
  return builtString
}

const Template: Story<StoryModalProps> = ({ bodyContent, ...args }) => {
  const { isOpen, onOpen, onClose } = useDisclosure({ defaultIsOpen: true })
  return (
    <>
      <Button onClick={onOpen}>Open</Button>
      <Modal {...args} isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalCloseButton />
          <ModalHeader>Create workspace</ModalHeader>
          <ModalBody whiteSpace="pre-line">
            {bodyContent ?? generateLorem()}
          </ModalBody>
          <ModalFooter>
            <ButtonGroup>
              <Button variant="clear" colorScheme="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button>Create workspace</Button>
            </ButtonGroup>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  )
}

export const BasicUsage = Template.bind({})

export const InsideScroll = Template.bind({})
InsideScroll.args = {
  scrollBehavior: 'inside',
  bodyContent: generateLorem(5),
}

export const FullWithLongContent = Template.bind({})
FullWithLongContent.args = {
  size: 'full',
  bodyContent: generateLorem(30),
}

export const Mobile = Template.bind({})
Mobile.args = {
  size: 'mobile',
  bodyContent: generateLorem(5),
}
Mobile.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
}
