import { useEffect } from 'react'
import ReactDOM from 'react-dom'
import { useDisclosure } from '@chakra-ui/hooks'
import { Meta, Story } from '@storybook/react'
import { times } from 'lodash'

import { AdminFormViewDto, FormResponseMode, FormStatus } from '~shared/types'

import {
  getOwnedForms,
  transferOwnership,
} from '~/mocks/msw/handlers/admin-form/transfer-ownership'
import { getUser, MOCK_USER } from '~/mocks/msw/handlers/user'

import {
  fullScreenDecorator,
  LoggedInDecorator,
  viewports,
} from '~utils/storybook'

import { TransferOwnershipModal } from './TransferOwnershipModal'

// FIXME: getUser, MOCK_USER are imported from another mock file. Consider relocating to a commons file?
const createForm: (_: number) => AdminFormViewDto[] = (num: number) => {
  return times(num, (x) => {
    const formId = `618b2d5e648fb700700002b${x}`
    return {
      form: {
        _id: formId,
        status: FormStatus.Public,
        responseMode: FormResponseMode.Encrypt,
        title: `Test form ${formId}`,
        admin: {
          ...MOCK_USER,
        },
        lastModified: `2023-06-06T07:00:00.000Z`,
      },
    } as AdminFormViewDto
  })
}

const MOCK_OWNED_FORMS: AdminFormViewDto[] = createForm(10)

export default {
  title: 'Features/User/TransferOwnershipModal',
  component: TransferOwnershipModal,
  decorators: [fullScreenDecorator, LoggedInDecorator],
  parameters: {
    layout: 'fullscreen',
    // Prevent flaky tests due to modal animating in.
    chromatic: { pauseAnimationAtEnd: true },
    msw: [
      getUser({ delay: 0, mockUser: MOCK_USER }),
      getOwnedForms({
        overrides: [...MOCK_OWNED_FORMS.map((formView) => formView.form)],
      }),
      transferOwnership(),
    ],
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
    <TransferOwnershipModal
      {...modalProps}
      onClose={() => console.log('close modal')}
    />,
    el,
  )
}

export const Default = Template.bind({})

export const Mobile = Template.bind({})
Mobile.parameters = {
  viewport: {
    defaultViewport: 'mobile1',
  },
  chromatic: { viewports: [viewports.xs] },
}

export const FailureBecauseNoOwnedForms = Template.bind({})
FailureBecauseNoOwnedForms.parameters = {
  msw: [
    getUser({ delay: 0, mockUser: MOCK_USER }),
    getOwnedForms({ overrides: [] }),
    transferOwnership(),
  ],
}

export const FailureBecauseTransferEndpointFailed = Template.bind({})
FailureBecauseTransferEndpointFailed.parameters = {
  msw: [
    getUser({ delay: 0, mockUser: MOCK_USER }),
    getOwnedForms({
      overrides: [...MOCK_OWNED_FORMS.map((formView) => formView.form)],
    }),
    transferOwnership({ overrides: { status: 500, body: undefined } }),
  ],
}
