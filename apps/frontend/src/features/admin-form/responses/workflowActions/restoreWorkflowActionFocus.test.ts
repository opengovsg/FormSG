import { restoreWorkflowActionFocus } from './restoreWorkflowActionFocus'

const visible = (element: HTMLElement) => {
  vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
    top: 20,
    left: 20,
    bottom: 50,
    right: 120,
    width: 100,
    height: 30,
    x: 20,
    y: 20,
    toJSON: () => ({}),
  })
}
afterEach(() => {
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})
it('returns focus to a visible copy when the original action is hidden', () => {
  document.body.innerHTML =
    '<div id="root"><button hidden data-workflow-action="sendBack">Old</button><button data-workflow-action="sendBack">Visible</button></div>'
  const root = document.getElementById('root')!
  const buttons = root.querySelectorAll('button')
  visible(buttons[1])
  restoreWorkflowActionFocus(root, buttons[0], 'sendBack')
  expect(buttons[1]).toHaveFocus()
})
it('focuses the response heading when the action is no longer available', () => {
  document.body.innerHTML =
    '<div id="root"><h2 tabindex="-1" data-workflow-response-heading>Response</h2></div>'
  const root = document.getElementById('root')!
  restoreWorkflowActionFocus(root, null, 'sendBack')
  expect(root.querySelector('h2')).toHaveFocus()
})

it('finds the matching owner in a portal rather than another response action', () => {
  document.body.innerHTML =
    '<div id="root"></div><button data-workflow-action="sendBack" data-workflow-owner-id="other">Other response</button><button data-workflow-action="sendBack" data-workflow-owner-id="owner">Sticky copy</button>'
  const buttons = document.querySelectorAll('button')
  buttons.forEach(visible)
  restoreWorkflowActionFocus(
    document.getElementById('root')!,
    null,
    'sendBack',
    'owner',
  )
  expect(buttons[1]).toHaveFocus()
})
