import { getResponseScrollContainer } from '../IndividualResponsePage/getResponseScrollContainer'

const isAvailable = (element: HTMLElement): boolean => {
  if (
    !element.isConnected ||
    element.closest('[hidden], [aria-hidden="true"]') ||
    element.matches(':disabled, [aria-disabled="true"]')
  )
    return false
  const rect = element.getBoundingClientRect()
  const root = getResponseScrollContainer(element)?.getBoundingClientRect()
  return (
    rect.width > 0 &&
    rect.height > 0 &&
    rect.bottom > (root?.top ?? 0) &&
    rect.top < (root?.bottom ?? window.innerHeight)
  )
}

export const restoreWorkflowActionFocus = (
  root: HTMLElement,
  original: HTMLElement | null,
  action: string,
  ownerId?: string,
): void => {
  if (original && isAvailable(original)) {
    original.focus({ preventScroll: true })
    return
  }
  const replacement = Array.from(
    (ownerId ? document : root).querySelectorAll<HTMLElement>(
      '[data-workflow-action]',
    ),
  ).find(
    (element) =>
      element.dataset.workflowAction === action &&
      (!ownerId || element.dataset.workflowOwnerId === ownerId) &&
      isAvailable(element),
  )
  if (replacement) {
    replacement.focus({ preventScroll: true })
    return
  }
  const heading =
    root.querySelector<HTMLElement>('[data-workflow-response-heading]') ??
    root
      .closest('[role="dialog"]')
      ?.querySelector<HTMLElement>('[data-workflow-response-heading], h1, h2')
  const targetHeading =
    heading ??
    (document.querySelectorAll('[data-workflow-response-heading]').length === 1
      ? document.querySelector<HTMLElement>('[data-workflow-response-heading]')
      : null)
  targetHeading?.focus({ preventScroll: true })
}
