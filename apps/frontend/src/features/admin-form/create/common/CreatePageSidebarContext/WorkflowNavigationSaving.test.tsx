import { fireEvent, render, screen, waitFor } from '@testing-library/react'

import { useRegisterNavigationSave } from '~features/admin-form/common/navigationSave'

import {
  CreatePageSidebarProvider,
  DrawerTabs,
  useCreatePageSidebar,
} from './CreatePageSidebarContext'

const save = vi.fn<() => Promise<boolean>>()
const Harness = () => {
  const { activeTab, handleWorkflowClick, handleBuilderClick } =
    useCreatePageSidebar()
  useRegisterNavigationSave({ isDirty: true, save })
  return (
    <>
      <span>
        {activeTab === DrawerTabs.Workflow ? 'Workflow open' : 'Fields open'}
      </span>
      <button onClick={() => handleWorkflowClick(false)}>Workflow</button>
      <button onClick={() => handleBuilderClick(false)}>Fields</button>
    </>
  )
}

it('waits for a valid save before leaving Workflow through the Create sidebar', async () => {
  save.mockResolvedValueOnce(false).mockResolvedValueOnce(true)
  render(
    <CreatePageSidebarProvider>
      <Harness />
    </CreatePageSidebarProvider>,
  )
  fireEvent.click(screen.getByText('Workflow'))
  expect(screen.getByText('Workflow open')).toBeInTheDocument()
  fireEvent.click(screen.getByText('Fields'))
  await waitFor(() => expect(save).toHaveBeenCalledTimes(1))
  expect(screen.getByText('Workflow open')).toBeInTheDocument()
  fireEvent.click(screen.getByText('Fields'))
  await screen.findByText('Fields open')
  expect(save).toHaveBeenCalledTimes(2)
})
