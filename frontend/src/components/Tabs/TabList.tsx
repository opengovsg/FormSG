import { useRef, WheelEvent } from 'react'
import { TabList as ChakraTabList, TabListProps } from '@chakra-ui/react'
import useSwipeScroll from 'use-drag-scroll'

export const TabList = (props: TabListProps): JSX.Element => {
  // horizontal scroll on mouse wheel
  const scrollRef = useRef<HTMLDivElement>(null)
  const handleWheelEvent = (e: WheelEvent<HTMLDivElement>) => {
    const container = scrollRef.current
    if (container) {
      container.scrollTo({
        top: 0,
        left: container.scrollLeft + e.deltaY,
      })
    }
  }
  // horizontal scroll on drag
  useSwipeScroll({
    sliderRef: scrollRef,
  })
  return <ChakraTabList ref={scrollRef} onWheel={handleWheelEvent} {...props} />
}
