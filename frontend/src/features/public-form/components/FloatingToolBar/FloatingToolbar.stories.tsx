import { action } from '@storybook/addon-actions'
import { Meta, StoryFn } from '@storybook/react'

import { fullScreenDecorator, getMobileViewParameters } from '~utils/storybook'

import {
  PublicFormContext,
  PublicFormContextProps,
} from '../../PublicFormContext'

import { FloatingToolBar } from './FloatingToolbar'

export default {
  title: 'Features/PublicForm/FloatingToolBar',
  component: FloatingToolBar,
  decorators: [fullScreenDecorator],
  parameters: {
    layout: 'fullscreen',
  },
} as Meta

// Mock context values
const createMockContext = (
  overrides: Partial<PublicFormContextProps> = {},
): PublicFormContextProps => {
  const baseContext = {
    // Core component props
    miniHeaderRef: { current: null },
    formId: '507f1f77bcf86cd799439011',
    isAuthRequired: false,
    getTransactionId: async () => 'mock-transaction-id',
    expiryInMs: null,
    handleSubmitForm: undefined,
    handleLogout: undefined,
    isMobileDrawerOpen: false,
    onMobileDrawerOpen: action('onMobileDrawerOpen'),
    onMobileDrawerClose: action('onMobileDrawerClose'),
    isPaymentEnabled: false,
    isPreview: false,
    hasSingleSubmissionValidationError: false,
    hasRespondentNotWhitelistedError: false,
    onSaveDraft: action('onSaveDraft'),
    isSaveDraftEnabled: false,
    defaultFormValues: {},
    augmentedFormFields: [],
    fieldPrefillMap: {},

    // Override with provided values
    ...overrides,
  }

  // Add React Query props with type assertion to avoid complex typing
  return {
    ...baseContext,
    isLoading: false,
    isError: false,
    error: null,
    isSuccess: true,
    dataUpdatedAt: Date.now(),
    errorUpdatedAt: 0,
    failureCount: 0,
    isIdle: false,
    isLoadingError: false,
    isPlaceholderData: false,
    isPreviousData: false,
    isRefetchError: false,
    isStale: false,
    refetch: () => Promise.resolve({} as unknown),
    remove: () => {},
    status: 'success' as const,
  } as PublicFormContextProps
}

const Template: StoryFn = (args) => {
  const contextValue = createMockContext(
    args as Partial<PublicFormContextProps>,
  )

  return (
    <PublicFormContext.Provider value={contextValue}>
      <div
        style={{
          height: '100vh',
          backgroundColor: '#f7fafc',
          position: 'relative',
        }}
      >
        <div style={{ padding: '2rem' }}>
          <h1>Sample Form Content</h1>
          <p>
            This is where the form would be displayed. The FloatingToolBar
            should appear in the bottom right corner.
          </p>
        </div>
        <FloatingToolBar />
      </div>
    </PublicFormContext.Provider>
  )
}

export const Default = Template.bind({})
Default.args = {
  isPreview: false,
  isSaveDraftEnabled: false,
}

export const WithSaveDraftEnabled = Template.bind({})
WithSaveDraftEnabled.args = {
  isPreview: false,
  isSaveDraftEnabled: true,
}

export const WithSaveDraftAndLastSaved = Template.bind({})
WithSaveDraftAndLastSaved.args = {
  isPreview: false,
  isSaveDraftEnabled: true,
  draftLastSavedDateTimeString: 'Saved at 2:30 PM, 15 Nov 2024',
}

export const PreviewMode = Template.bind({})
PreviewMode.args = {
  isPreview: true,
  isSaveDraftEnabled: false,
}

export const PreviewModeWithSaveDraft = Template.bind({})
PreviewModeWithSaveDraft.args = {
  isPreview: true,
  isSaveDraftEnabled: true,
  draftLastSavedDateTimeString: 'Saved at 1:15 PM, 15 Nov 2024',
}

export const WithSubmissionDataNoFloatingToolbar = Template.bind({})
WithSubmissionDataNoFloatingToolbar.args = {
  isPreview: false,
  isSaveDraftEnabled: true,
  submissionData: {
    id: 'sub_12345',
    timestamp: Date.now(),
  },
}

// Mobile variants
export const MobileDefault = Template.bind({})
MobileDefault.parameters = {
  ...getMobileViewParameters(),
}
MobileDefault.args = {
  isPreview: false,
  isSaveDraftEnabled: false,
}

export const MobileWithSaveDraft = Template.bind({})
MobileWithSaveDraft.parameters = {
  ...getMobileViewParameters(),
}
MobileWithSaveDraft.args = {
  isPreview: false,
  isSaveDraftEnabled: true,
  draftLastSavedDateTimeString: 'Saved at 3:45 PM, 15 Nov 2024',
}

export const MobilePreviewMode = Template.bind({})
MobilePreviewMode.parameters = {
  ...getMobileViewParameters(),
}
MobilePreviewMode.args = {
  isPreview: true,
  isSaveDraftEnabled: true,
}
