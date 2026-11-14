import { useState } from 'react'
import { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'

import { FormAuthType } from 'formsg-shared/types'

import { StepLoginControls } from './StepLoginControls'

const meta = {
  title: 'Features/AdminForm/StepLoginControls',
  component: StepLoginControls,
  args: {
    authType: FormAuthType.NIL,
    savedAuthType: FormAuthType.NIL,
    esrvcId: '',
    isDisabled: false,
    idPrefix: 'step-login-story',
    onAuthTypeChange: fn(),
    onEsrvcIdChange: fn(),
  },
  render: function Render(args) {
    const [authType, setAuthType] = useState(args.authType)
    const [esrvcId, setEsrvcId] = useState(args.esrvcId)
    return (
      <StepLoginControls
        {...args}
        savedAuthType={args.authType}
        authType={authType}
        esrvcId={esrvcId}
        onAuthTypeChange={(next) => {
          args.onAuthTypeChange(next)
          setAuthType(next)
        }}
        onEsrvcIdChange={(next) => {
          args.onEsrvcIdChange(next)
          setEsrvcId(next)
        }}
      />
    )
  },
} satisfies Meta<typeof StepLoginControls>
export default meta
type Story = StoryObj<typeof meta>

export const NoLoginRequired: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(
      canvas.getByRole('radio', { name: 'No login required' }),
    ).toBeChecked()
    await userEvent.click(canvas.getByRole('radio', { name: /^Corppass/ }))
    await expect(canvas.getByRole('textbox')).toBeVisible()
    await userEvent.click(
      canvas.getByRole('radio', { name: 'No login required' }),
    )
    await expect(canvas.queryByRole('textbox')).not.toBeInTheDocument()
  },
}
export const Corppass: Story = {
  args: { authType: FormAuthType.CP, esrvcId: 'AGENCY-SERVICE' },
}
export const LegacySingpass: Story = {
  args: { authType: FormAuthType.SP },
  play: async ({ canvasElement, args }) => {
    const radio = within(canvasElement).getByRole('radio', {
      name: 'Singpass Log in using Singpass',
    })
    await expect(radio).toBeChecked()
    await expect(radio).toHaveAttribute('value', FormAuthType.SP)
    await expect(args.onAuthTypeChange).not.toHaveBeenCalled()
  },
}
export const LockedLogin: Story = {
  args: { authType: FormAuthType.MyInfo, isDisabled: true },
}
