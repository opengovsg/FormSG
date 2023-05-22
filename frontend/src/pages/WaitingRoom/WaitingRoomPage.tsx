import { useEffect, useState } from 'react'
import { useQuery } from 'react-query'
import { useNavigate } from 'react-router-dom'
import { Box, Flex, Stack, Text } from '@chakra-ui/react'
import axios, { AxiosError } from 'axios'

import {
  WaitingRoomLockedErrorDto,
  WaitingRoomStatusDto,
} from '~shared/types/waitingRoom'

import { AppFooter } from '~/app/AppFooter'

import { LANDING_ROUTE } from '~constants/routes'

import { WaitingRoomSvgr } from './WaitingRoomSvgr'

const WAITING_ROOM_STATUS_ENDPOINT = '/api/v3/waiting-room/status'

export const WaitingRoomPage = (): JSX.Element => {
  const navigate = useNavigate()

  // Keep track of current time
  // Used to refresh time display every 30 secs
  const [currentTime, setCurrentTime] = useState(new Date())

  const {
    data: waitingRoomStatus,
    error,
    isLoading,
  } = useQuery<WaitingRoomStatusDto, AxiosError<WaitingRoomLockedErrorDto>>(
    'waitingRoom',
    () =>
      axios
        .get<WaitingRoomStatusDto>(WAITING_ROOM_STATUS_ENDPOINT)
        .then((res) => res.data),
    {
      // No need to refetch or retry
      staleTime: Infinity,
      retry: false,
    },
  )

  useEffect(() => {
    // If 404 error, there is no target form ID. redirect to landing page
    if (error?.response?.status === 404) {
      navigate(LANDING_ROUTE)
    }

    // If 200, set timer and redirect upon timer expiry
    // Every 30s, also refresh currentTime displayed on the frontend, so that user feels assured that there is progress
    if (waitingRoomStatus?.waitSeconds) {
      const timer = setTimeout(() => {
        const formId = waitingRoomStatus?.targetFormId
        navigate(`/${formId}`)
      }, waitingRoomStatus?.waitSeconds * 1000) // If waitseconds is 0, then this will trigger immediately

      const interval = setInterval(() => {
        setCurrentTime(new Date()) // Update time to display every 30s
      }, 30000)

      return () => {
        clearTimeout(timer)
        clearInterval(interval)
      }
    }
  }, [waitingRoomStatus, error, navigate])

  return (
    <Flex flex={1} flexDir="column" h="100%">
      <Flex
        justify="flex-start"
        align="center"
        flexDir="column"
        flex={1}
        pb="3rem"
      >
        <Box
          height="fit-content"
          bgColor="primary.500"
          w="100%"
          mb="5rem"
          pt="10rem"
        >
          <WaitingRoomSvgr
            w="100%"
            mb="-0.5rem"
            maxH={{ base: '220px', md: 'initial' }}
          />
        </Box>
        <Stack
          px="1.5rem"
          spacing="2.5rem"
          color="secondary.500"
          align="center"
          textAlign="center"
        >
          {isLoading ? null : error?.response?.status === 423 ? ( // 423 error means form not activated
            <Box>
              <Text as="h2" textStyle="h2">
                This form is not available.
              </Text>
              <Text textStyle="body1" mt="1rem">
                {/* Display the form inactive message from the target form */}
                {error?.response?.data?.inactiveMessage ?? ''}
              </Text>
            </Box>
          ) : error ? (
            // Generic non-404 error. 404 error would have been redirected to landing page
            <Box>
              <Text as="h2" textStyle="h2">
                This form is not available.
              </Text>
            </Box>
          ) : // 200 status. Regardless of the actual wait, we show the maxWaitMinutes. Otherwise, user will see a different wait time everytime they refresh.
          waitingRoomStatus ? (
            <Box>
              <Text as="h2" textStyle="h2">
                Your estimated wait time is {waitingRoomStatus.maxWaitMinutes}{' '}
                minutes. Thank you for your patience!
              </Text>
              <Text textStyle="body1" mt="1rem">
                We are experiencing high volume of traffic. We have placed you
                in a virtual queue to limit the amount of users on our site.
                This page will automatically refresh.
              </Text>
              <Text textStyle="body1" mt="2.5rem" textColor="secondary.300">
                Last updated {currentTime.toLocaleString('en-SG')}
              </Text>
            </Box>
          ) : null}
        </Stack>
      </Flex>
      <Box py={{ lg: '3rem' }} px={{ lg: '9.25rem' }} bg="primary.100">
        <AppFooter variant="compact" />
      </Box>
    </Flex>
  )
}
