/* eslint-disable react-refresh/only-export-components */
import { useEffect } from 'react'
import {
  createMemoryRouter,
  createRoutesFromElements,
  Route,
  RouterProvider,
} from 'react-router-dom'
import { Box, BoxProps, Center, useDisclosure } from '@chakra-ui/react'
import { Decorator } from '@storybook/react-vite'
import dayjs from 'dayjs'
import mockdate from 'mockdate'

import { AuthContext } from '~contexts/AuthContext'
import {
  EMERGENCY_CONTACT_KEY_PREFIX,
  FEATURE_TOUR_KEY_PREFIX,
  ROLLOUT_ANNOUNCEMENT_KEY_PREFIX,
} from '~constants/localStorage'

import { AdminFormLayout } from '~features/admin-form/common/AdminFormLayout'
import { BuilderAndDesignContext } from '~features/admin-form/create/builder-and-design/BuilderAndDesignContext'
import { CreatePageSideBarLayoutProvider } from '~features/admin-form/create/common/CreatePageSideBarLayoutContext'

import { fillHeightCss } from './fillHeightCss'

export const centerDecorator: Decorator = (storyFn) => (
  <Center>{storyFn()}</Center>
)

export const fixedHeightDecorator =
  (height: BoxProps['h']): Decorator =>
  (Story) => (
    <Box h={height}>
      <Story />
    </Box>
  )

export const fullScreenDecorator: Decorator = (storyFn) => (
  <Box w="100vw" css={fillHeightCss}>
    {storyFn()}
  </Box>
)

export const LoggedOutDecorator: Decorator = (storyFn) => {
  return (
    <AuthContext.Provider value={{ isAuthenticated: false }}>
      {storyFn()}
    </AuthContext.Provider>
  )
}

export const LoggedInDecorator: Decorator = (storyFn) => {
  return (
    <AuthContext.Provider value={{ isAuthenticated: true }}>
      {storyFn()}
    </AuthContext.Provider>
  )
}

export const ViewedFeatureTourDecorator: Decorator = (
  storyFn,
  { parameters },
) => {
  const userId = parameters.userId
  const featureTourKey = FEATURE_TOUR_KEY_PREFIX + userId
  window.localStorage.setItem(featureTourKey, JSON.stringify(true))

  useEffect(() => {
    return () => window.localStorage.removeItem(featureTourKey)
  }, [featureTourKey, userId])

  return storyFn()
}

export const ViewedRolloutDecorator: Decorator = (storyFn, { parameters }) => {
  const userId = parameters.userId
  const rolloutKey = ROLLOUT_ANNOUNCEMENT_KEY_PREFIX + userId
  window.localStorage.setItem(rolloutKey, JSON.stringify(true))

  useEffect(() => {
    return () => window.localStorage.removeItem(rolloutKey)
  }, [rolloutKey, userId])

  return storyFn()
}

export const ViewedEmergencyContactDecorator: Decorator = (
  storyFn,
  { parameters },
) => {
  const userId = parameters.userId
  const emergencyContactKey = EMERGENCY_CONTACT_KEY_PREFIX + userId
  window.localStorage.setItem(emergencyContactKey, JSON.stringify(true))

  useEffect(() => {
    return () => window.localStorage.removeItem(emergencyContactKey)
  }, [emergencyContactKey, userId])

  return storyFn()
}

export const EditFieldDrawerDecorator: Decorator = (storyFn) => {
  const deleteFieldModalDisclosure = useDisclosure()
  const deletePaymentModalDisclosure = useDisclosure()
  return (
    <Box maxW="33.25rem">
      <CreatePageSideBarLayoutProvider>
        <BuilderAndDesignContext.Provider
          value={{
            deleteFieldModalDisclosure,
            deletePaymentModalDisclosure,
          }}
        >
          {storyFn()}
        </BuilderAndDesignContext.Provider>
      </CreatePageSideBarLayoutProvider>
    </Box>
  )
}

export const ADMIN_FORM_CREATE_PAGE_FORM_ID = '12345'
export const AdminFormCreatePageDecorator: Decorator = (storyFn) => {
  const router = createMemoryRouter(
    createRoutesFromElements(
      <Route path={'/:formId'} element={<AdminFormLayout />}>
        <Route index element={storyFn()} />
      </Route>,
    ),
    {
      initialEntries: [`/${ADMIN_FORM_CREATE_PAGE_FORM_ID}`],
    },
  )
  return <RouterProvider router={router} />
}

export const mockDateDecorator: Decorator = (storyFn, { parameters }) => {
  mockdate.reset()

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    return () => mockdate.reset()
  }, [])

  if (parameters.mockdate) {
    mockdate.set(parameters.mockdate)

    const mockedDate = dayjs(parameters.mockdate).format('DD-MM-YYYY HH:mma')

    return (
      <>
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
      </>
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
  ({ path, initialEntries }: StoryRouterProps): Decorator =>
  (storyFn, { parameters }) => {
    const router = createMemoryRouter(
      createRoutesFromElements(
        <Route path={parameters?.router?.path ?? path} element={storyFn()} />,
      ),
      {
        initialEntries: parameters?.router?.initialEntries ?? initialEntries,
      },
    )
    return <RouterProvider router={router} />
  }

/** Assign to `Story.globals`: Storybook ignores globals under parameters. */
export const getMobileViewGlobals = () => {
  return { viewport: { value: 'mobile1', isRotated: false } }
}

/** Assign to `Story.globals`: Storybook ignores globals under parameters. */
export const getTabletViewGlobals = () => {
  return { viewport: { value: 'tablet', isRotated: false } }
}

type ViewportMode = 'tablet' | 'mobile'

const VIEWPORT_MODES: Record<ViewportMode, { viewport: string }> = {
  tablet: { viewport: 'tablet' },
  mobile: { viewport: 'mobile1' },
}

/**
 * Argos modes that capture a story at the default (desktop) size and again at
 * each given viewport, instead of a separate story per viewport. Set it as
 * `parameters.argos.modes`; the viewport keys are defined in the preview.
 */
export const viewportModes = (...viewports: ViewportMode[]) => ({
  desktop: {},
  ...Object.fromEntries(viewports.map((v) => [v, VIEWPORT_MODES[v]])),
})
