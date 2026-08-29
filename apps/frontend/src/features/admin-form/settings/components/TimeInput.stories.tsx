import { useState } from 'react'
import { Box, FormControl, Stack, Text } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react'

import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'

import { TimeInput } from './TimeInput'

/**
 * TEMPORARY — see the note in TimeInput.tsx. These stories exist so the stopgap
 * time input can be eyeballed before the real Time field is designed.
 */
export default {
  title: 'Features/AdminForm/Settings/TimeInput',
  component: TimeInput,
  parameters: {
    chromatic: { pauseAnimationAtEnd: true, delay: 300 },
  },
} as Meta

/**
 * Live input. The things worth trying by hand: type "123" and tab away (it
 * settles to 01:23), type "3:00pm" (the toggle follows), and click AM/PM.
 */
const InteractiveTemplate: StoryFn = () => {
  const [value, setValue] = useState('09:30')
  const [error, setError] = useState<string>()

  return (
    <Box maxW="20rem">
      <FormControl isInvalid={!!error}>
        <FormLabel description="Nothing is reformatted until you leave the field.">
          Expiry time
        </FormLabel>
        <TimeInput
          value={value}
          onChange={setValue}
          onCommit={(committed) =>
            setError(committed ? undefined : 'Please enter a valid time')
          }
        />
        <FormErrorMessage>{error}</FormErrorMessage>
      </FormControl>
      <Text mt="1rem" textStyle="caption-1" color="secondary.400">
        Stored value (24-hour): <code>{value || '(not a time)'}</code>
      </Text>
    </Box>
  )
}

export const Interactive = InteractiveTemplate.bind({})

/**
 * Static states. Values here are canonical 24-hour — the 12-hour reading and
 * the meridiem shown beside it are both derived, which is the point.
 */
const StatesTemplate: StoryFn = () => (
  <Stack spacing="1.5rem" maxW="20rem">
    <FormControl>
      <FormLabel>Empty</FormLabel>
      <TimeInput value="" onChange={() => undefined} />
    </FormControl>

    <FormControl>
      <FormLabel>Midnight — 00:00 reads as 12:00 AM</FormLabel>
      <TimeInput value="00:00" onChange={() => undefined} />
    </FormControl>

    <FormControl>
      <FormLabel>Morning — 09:05</FormLabel>
      <TimeInput value="09:05" onChange={() => undefined} />
    </FormControl>

    <FormControl>
      <FormLabel>Noon — 12:00 reads as 12:00 PM</FormLabel>
      <TimeInput value="12:00" onChange={() => undefined} />
    </FormControl>

    <FormControl>
      <FormLabel>End of day — 23:59 reads as 11:59 PM</FormLabel>
      <TimeInput value="23:59" onChange={() => undefined} />
    </FormControl>

    <FormControl isInvalid>
      <FormLabel>Invalid — what the admin typed is left on screen</FormLabel>
      <TimeInput value="" onChange={() => undefined} />
      <FormErrorMessage>Please enter a valid time</FormErrorMessage>
    </FormControl>

    <FormControl isDisabled>
      <FormLabel>Disabled</FormLabel>
      <TimeInput value="18:00" onChange={() => undefined} isDisabled />
    </FormControl>
  </Stack>
)

export const States = StatesTemplate.bind({})
