import { screen } from '@testing-library/react'

import { render } from '~/test-utils'

import {
  PublicFormContext,
  PublicFormContextProps,
} from '~features/public-form/PublicFormContext'

import { MiniHeader } from './FormHeader'

const renderMiniHeader = ({
  isSaveDraftEnabled,
}: {
  isSaveDraftEnabled: boolean
}) =>
  render(
    <PublicFormContext.Provider
      value={
        {
          formId: 'mock-form-id',
          isSaveDraftEnabled,
          onSaveDraft: vi.fn(),
        } as unknown as PublicFormContextProps
      }
    >
      <MiniHeader
        isOpen
        title="A long form"
        titleBg="primary.500"
        titleColor="white"
      />
    </PublicFormContext.Provider>,
  )

// The sticky header is aria-hidden, so the query must opt into hidden elements.
const querySaveDraftButton = () =>
  screen.queryByRole('button', { name: 'Save a draft', hidden: true })

describe('MiniHeader', () => {
  it('offers save draft when the form has save draft enabled', () => {
    renderMiniHeader({ isSaveDraftEnabled: true })

    expect(querySaveDraftButton()).toBeVisible()
  })

  it('does not offer save draft when the form has save draft disabled', () => {
    renderMiniHeader({ isSaveDraftEnabled: false })

    expect(querySaveDraftButton()).not.toBeInTheDocument()
  })
})
