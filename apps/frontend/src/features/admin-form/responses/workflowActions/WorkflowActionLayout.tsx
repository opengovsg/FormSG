import { ReactNode, Ref, useEffect, useState } from 'react'
import { Box, Portal } from '@chakra-ui/react'

import { getResponseScrollContainer } from '../IndividualResponsePage/getResponseScrollContainer'
import { ResponseOverview } from '../IndividualResponsePage/ResponseOverview'

import {
  ActionLocation,
  useWorkflowActionPlacement,
} from './useWorkflowActionPlacement'
import {
  WorkflowActionButtons,
  WorkflowActionDescriptor,
} from './WorkflowActionButtons'

export const WorkflowActionLayout = ({
  overview,
  actions,
  children,
}: {
  overview: ReactNode
  actions: WorkflowActionDescriptor[]
  children: (
    actions: ReactNode,
    rowRef: Ref<HTMLDivElement>,
    showActions: boolean,
  ) => ReactNode
}) => {
  const [topRow, setTopRow] = useState<HTMLDivElement | null>(null)
  const [currentRow, setCurrentRow] = useState<HTMLDivElement | null>(null)
  const [focusedLocation, setFocusedLocation] = useState<ActionLocation | null>(
    null,
  )
  const [bounds, setBounds] = useState({ top: 0, left: 0, width: 0 })
  useEffect(() => {
    if (actions.length === 0) setFocusedLocation(null)
  }, [actions.length])
  const root = getResponseScrollContainer(topRow)
  const placement = useWorkflowActionPlacement({
    root,
    topRow,
    currentRow,
    focusedLocation,
  })
  useEffect(() => {
    const update = () => {
      const rect = topRow?.getBoundingClientRect()
      setBounds({
        top: Math.max(root?.getBoundingClientRect().top ?? 0, 0),
        left: rect?.left ?? 0,
        width: rect?.width ?? 0,
      })
    }
    update()
    window.addEventListener('resize', update)
    window.addEventListener('scroll', update, true)
    return () => {
      window.removeEventListener('resize', update)
      window.removeEventListener('scroll', update, true)
    }
  }, [topRow, root])
  const focusProps = (location: ActionLocation) => ({
    onFocusCapture: () => setFocusedLocation(location),
    onBlurCapture: (event: React.FocusEvent<HTMLDivElement>) => {
      if (!event.currentTarget.contains(event.relatedTarget as Node | null))
        setFocusedLocation(null)
    },
  })
  const buttons = (location: ActionLocation) => (
    <Box {...focusProps(location)}>
      <WorkflowActionButtons actions={actions} />
    </Box>
  )
  return (
    <Box data-workflow-layout>
      <ResponseOverview
        actions={
          actions.length ? (
            <Box ref={setTopRow}>{buttons('top')}</Box>
          ) : undefined
        }
        disableSticky
      >
        {overview}
      </ResponseOverview>
      {children(
        actions.length ? buttons('current') : undefined,
        setCurrentRow,
        placement.showCurrentActions,
      )}
      {actions.length > 0 &&
        placement.showStickyActions &&
        bounds.width > 0 && (
          <Portal>
            <Box
              position="fixed"
              top={`${bounds.top}px`}
              left={`${bounds.left}px`}
              width={`${bounds.width}px`}
              zIndex={1401}
              bg="primary.100"
              px="1.5rem"
              py="1rem"
              border="1px solid"
              borderColor="neutral.300"
              borderRadius="8px"
              boxShadow="0 4px 8px rgba(0,0,0,0.08)"
              data-workflow-sticky
            >
              {buttons('sticky')}
            </Box>
          </Portal>
        )}
    </Box>
  )
}
