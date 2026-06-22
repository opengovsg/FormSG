import { screen } from '@testing-library/react'

import { FormResponseMode } from 'formsg-shared/types'

import { render } from '~/test-utils'

import { CreatePageSidebar } from './CreatePageSidebar'

const mockUseFeatureIsOn = vi.fn()
const mockResponseMode = { current: FormResponseMode.Multirespondent }

vi.mock('@growthbook/growthbook-react', () => ({
  useFeatureIsOn: () => mockUseFeatureIsOn(),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('~hooks/useIsMobile', () => ({
  useIsMobile: () => false,
}))

vi.mock('~features/admin-form/common/queries', () => ({
  useAdminForm: () => ({ data: { responseMode: mockResponseMode.current } }),
}))

vi.mock('~features/user/queries', () => ({
  useUser: () => ({ user: undefined, isLoading: false }),
}))

vi.mock('~features/user/mutations', () => ({
  useUserMutations: () => ({ updateLastSeenFlagMutation: { mutate: vi.fn() } }),
}))

vi.mock('../../builder-and-design/useDirtyFieldStore', () => ({
  isDirtySelector: vi.fn(),
  useDirtyFieldStore: () => false,
}))

vi.mock('../../builder-and-design/useFieldBuilderStore', () => ({
  setToInactiveSelector: vi.fn(),
  useFieldBuilderStore: () => vi.fn(),
}))

vi.mock(
  '~features/admin-form/create/common/CreatePageSidebarContext/CreatePageSidebarContext',
  () => ({
    DrawerTabs: {
      Builder: 0,
      Design: 1,
      Logic: 2,
      EndPage: 3,
      Workflow: 4,
    },
    useCreatePageSidebar: () => ({
      activeTab: null,
      handleBuilderClick: vi.fn(),
      handleDesignClick: vi.fn(),
      handleLogicClick: vi.fn(),
      handleEndpageClick: vi.fn(),
      handleWorkflowClick: vi.fn(),
    }),
  }),
)

const navTrackingOrder = () =>
  screen
    .getAllByRole('button')
    .map((el) => el.getAttribute('data-dd-action-name'))
    .filter((name) => name && name !== 'create_builder.drawer_tab.help')

describe('CreatePageSidebar', () => {
  it('renders MRF tabs in the order Fields, Header, Logic, Thank you, Workflow when the flag is off (control = production)', () => {
    mockUseFeatureIsOn.mockReturnValue(false)
    mockResponseMode.current = FormResponseMode.Multirespondent

    render(<CreatePageSidebar />)

    expect(navTrackingOrder()).toEqual([
      'create_builder.drawer_tab.add_fields',
      'create_builder.drawer_tab.edit_header',
      'create_builder.drawer_tab.add_logic',
      'create_builder.drawer_tab.edit_thank_you_page',
      'create_builder.drawer_tab.add_workflow',
    ])
  })

  it('keeps the production divider above the MRF workflow tab in the control arm', () => {
    mockUseFeatureIsOn.mockReturnValue(false)
    mockResponseMode.current = FormResponseMode.Multirespondent

    render(<CreatePageSidebar />)

    expect(screen.getByRole('separator')).toBeInTheDocument()
  })

  it('shows nav labels, drops the divider, and moves the workflow tab into the middle (after Header) in the treatment arm', () => {
    mockUseFeatureIsOn.mockReturnValue(true)
    mockResponseMode.current = FormResponseMode.Multirespondent

    render(<CreatePageSidebar />)

    expect(
      screen.getByText('features.adminForm.sidebar.navLabels.workflow'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('separator')).not.toBeInTheDocument()
    expect(navTrackingOrder()).toEqual([
      'create_builder.drawer_tab.add_fields',
      'create_builder.drawer_tab.edit_header',
      'create_builder.drawer_tab.add_workflow',
      'create_builder.drawer_tab.add_logic',
      'create_builder.drawer_tab.edit_thank_you_page',
    ])
  })

  it('omits the workflow tab and divider for non-MRF forms', () => {
    mockUseFeatureIsOn.mockReturnValue(false)
    mockResponseMode.current = FormResponseMode.Encrypt

    render(<CreatePageSidebar />)

    expect(navTrackingOrder()).not.toContain(
      'create_builder.drawer_tab.add_workflow',
    )
    expect(screen.queryByRole('separator')).not.toBeInTheDocument()
  })
})
