import { useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Flex } from '@chakra-ui/react'

import { LogicBadge } from '~features/admin-form/create/logic/components/LogicContent/InactiveLogicBlock/LogicBadge'

const COPY_KEY = 'features.adminForm.sidebar.workflow.respondentBlock'

export const RecipientSummary = ({ labels }: { labels: string[] }) => {
  const { t } = useTranslation()
  const container = useRef<HTMLDivElement>(null)
  const measurements = useRef<HTMLDivElement>(null)
  const [visible, setVisible] = useState(0)
  const count = labels.length
  const labelsKey = labels.join('\n')
  useLayoutEffect(() => {
    const row = container.current
    const ruler = measurements.current
    if (!row || !ruler || !count) return
    const measure = () => {
      const gap = parseFloat(getComputedStyle(ruler).columnGap)
      let width = 0
      let fit = 0
      for (let i = 0; i < count; i++) {
        width += ruler.children[i].getBoundingClientRect().width + (i ? gap : 0)
        const remaining = count - i - 1
        const total =
          width +
          (remaining
            ? gap +
              ruler.children[count + remaining - 1].getBoundingClientRect()
                .width
            : 0)
        if (total <= row.clientWidth) fit = i + 1
      }
      setVisible(fit)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(row)
    observer.observe(ruler)
    return () => observer.disconnect()
  }, [labelsKey, count])

  const badge = (label: string, index: number) => (
    <LogicBadge key={index} bg="white" whiteSpace="nowrap">
      {label}
    </LogicBadge>
  )
  const overflow = (n: number) => t(`${COPY_KEY}.moreRecipients`, { count: n })
  return (
    <Box
      ref={container}
      position="relative"
      width="100%"
      overflow="hidden"
      aria-hidden
    >
      <Flex justify="flex-end" gap="0.25rem">
        {labels.slice(0, visible).map(badge)}
        {count > visible && badge(overflow(count - visible), count)}
        {!count && badge(t(`${COPY_KEY}.noRecipients`), 0)}
      </Flex>
      <Flex
        ref={measurements}
        position="absolute"
        width="max-content"
        visibility="hidden"
        top="0"
        gap="0.25rem"
      >
        {labels.map(badge)}
        {labels.map((_, i) => badge(overflow(i + 1), count + i))}
      </Flex>
    </Box>
  )
}
