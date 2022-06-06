import { useEffect } from 'react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { Box, Center, useDisclosure } from '@chakra-ui/react'
import { DecoratorFn } from '@storybook/react'
import dayjs from 'dayjs'
import mockdate from 'mockdate'

import { theme } from '~/theme'

import { LOGGED_IN_KEY } from '~constants/localStorage'

import { BuilderAndDesignContext } from '~features/admin-form/create/builder-and-design/BuilderAndDesignContext'
import { CreatePageSidebarProvider } from '~features/admin-form/create/common/CreatePageSidebarContext'

export const centerDecorator: DecoratorFn = (storyFn) => (
  <Center>{storyFn()}</Center>
)

export const fullScreenDecorator: DecoratorFn = (storyFn) => (
  <Box w="100vw" h="100vh">
    {storyFn()}
  </Box>
)

export const LoggedOutDecorator: DecoratorFn = (storyFn) => {
  useEffect(() => {
    window.localStorage.removeItem(LOGGED_IN_KEY)
  }, [])

  return storyFn()
}

export const LoggedInDecorator: DecoratorFn = (storyFn) => {
  useEffect(() => {
    window.localStorage.setItem(LOGGED_IN_KEY, JSON.stringify(true))

    return () => window.localStorage.removeItem(LOGGED_IN_KEY)
  }, [])

  return storyFn()
}

export const EditFieldDrawerDecorator: DecoratorFn = (storyFn) => {
  const deleteFieldModalDisclosure = useDisclosure()
  return (
    <Box maxW="33.25rem">
      <CreatePageSidebarProvider>
        <BuilderAndDesignContext.Provider
          value={{
            deleteFieldModalDisclosure,
          }}
        >
          {storyFn()}
        </BuilderAndDesignContext.Provider>
      </CreatePageSidebarProvider>
    </Box>
  )
}

export const mockDateDecorator: DecoratorFn = (storyFn, { parameters }) => {
  mockdate.reset()

  if (parameters.mockdate) {
    mockdate.set(parameters.mockdate)

    const mockedDate = dayjs(parameters.mockdate).format('DD-MM-YYYY HH:mma')

    return (
      <Box>
        <Box
          pos="fixed"
          top={0}
          right={0}
          bg="white"
          p="0.25rem"
          fontSize="0.75rem"
          lineHeight={1}
          zIndex="docked"
        >
          Mocking date: {mockedDate}
        </Box>
        {storyFn()}
      </Box>
    )
  }
  return storyFn()
}

interface StoryRouterProps {
  initialEntries: string[]
  path: string
}
/**
 * Decorator to instantiate a story with an initial route.
 */
export const StoryRouter =
  ({ path, initialEntries }: StoryRouterProps): DecoratorFn =>
  (storyFn) => {
    return (
      <MemoryRouter initialEntries={initialEntries}>
        <Routes>
          <Route path={path} element={storyFn()} />
        </Routes>
      </MemoryRouter>
    )
  }

/**
 * Helper function to convert theme breakpoint into viewport width in px for
 * Chromatic viewpoint snapshots.
 * @param breakpoint the theme breakpoint to convert
 * @returns the number pixel width of the given breakpoint.
 */
const breakpointToViewportWidth = (
  breakpoint: keyof typeof theme.breakpoints,
) => {
  const rem = 16
  return parseInt(theme.breakpoints[breakpoint]) * rem
}

/**
 * Viewports mapping viewport key to their width in (pixel) number.
 * Used for Chromatic viewpoint snapshots which requires the numbers in pixels.
 */
export const viewports = {
  xs: breakpointToViewportWidth('xs'),
  sm: breakpointToViewportWidth('sm'),
  md: breakpointToViewportWidth('md'),
  lg: breakpointToViewportWidth('lg'),
  xl: breakpointToViewportWidth('xl'),
}

export const getMobileViewParameters = () => {
  return {
    viewport: {
      defaultViewport: 'mobile1',
    },
    chromatic: { viewports: [viewports.xs] },
  }
}

export const getTabletViewParameters = () => {
  return {
    viewport: {
      defaultViewport: 'tablet',
    },
    chromatic: { viewports: [viewports.md] },
  }
}
