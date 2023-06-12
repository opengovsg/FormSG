import { useEffect } from 'react'
import ReactDOM from 'react-dom'
import { useDisclosure } from '@chakra-ui/react'
import { Meta, Story } from '@storybook/react'

import {
  fullScreenDecorator,
  getMobileViewParameters,
  LoggedInDecorator,
  StoryRouter,
} from '~utils/storybook'

import { FormIssueFeedbackModal } from './FormIssueFeedbackModal'

export default {
  title: 'Features/PublicForm/PreSubmissionFeedbackModal',
  component: FormIssueFeedbackModal,
  decorators: [
    fullScreenDecorator,
    LoggedInDecorator,
    StoryRouter({ initialEntries: ['/12345'], path: '/:formId' }),
  ],
  parameters: {
    layout: 'fullscreen',
  },
} as Meta

const modalRoot = document.createElement('div')
document.body.appendChild(modalRoot)

const Template: Story = () => {
  const modalProps = useDisclosure({ defaultIsOpen: true })
  const el = document.createElement('div')
  useEffect(() => {
    modalRoot.appendChild(el)
    return () => {
      modalRoot.removeChild(el)
    }
  })

  return ReactDOM.createPortal(
    <FormIssueFeedbackModal
      {...modalProps}
      onClose={() => console.log('close modal')}
    />,
    el,
  )
}

export const Default = Template.bind({})

export const Mobile = Template.bind({})
Mobile.parameters = {
  ...getMobileViewParameters(),
}
