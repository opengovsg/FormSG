import { useState } from 'react'
import { Box, FormControl, Stack, Text } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react'

import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'

import { isValidTimeOfDay, TimeInput } from './TimeInput'

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

/** Live input: type into it to see the mask insert the colon at HH|MM. */
const InteractiveTemplate: StoryFn = () => {
  const [value, setValue] = useState('')
  const [touched, setTouched] = useState(false)

  const isInvalid = touched && !isValidTimeOfDay(value)

  return (
    <Box maxW="20rem">
      <FormControl isInvalid={isInvalid}>
        <FormLabel description="Type digits only — the colon is inserted for you.">
          Expiry time (24-hour)
        </FormLabel>
        <TimeInput
          value={value}
          onChange={setValue}
          onBlur={() => setTouched(true)}
        />
        <FormErrorMessage>
          Enter a 24-hour time between 00:00 and 23:59
        </FormErrorMessage>
      </FormControl>
      <Text mt="1rem" textStyle="caption-1" color="secondary.400">
        Parsed value: <code>{value || '(empty)'}</code> —{' '}
        {isValidTimeOfDay(value) ? 'valid' : 'not yet valid'}
      </Text>
    </Box>
  )
}

export const Interactive = InteractiveTemplate.bind({})

/** Static states, side by side, for a quick visual scan. */
const StatesTemplate: StoryFn = () => (
  <Stack spacing="1.5rem" maxW="20rem">
    <FormControl>
      <FormLabel>Empty</FormLabel>
      <TimeInput value="" onChange={() => undefined} />
    </FormControl>

    <FormControl>
      <FormLabel>Valid — end of day</FormLabel>
      <TimeInput value="23:59" onChange={() => undefined} />
    </FormControl>

    <FormControl>
      <FormLabel>Valid — midnight</FormLabel>
      <TimeInput value="00:00" onChange={() => undefined} />
    </FormControl>

    <FormControl>
      <FormLabel>Partially typed</FormLabel>
      <TimeInput value="09:3" onChange={() => undefined} />
    </FormControl>

    <FormControl isInvalid>
      <FormLabel>Invalid — hour out of range</FormLabel>
      <TimeInput value="25:00" onChange={() => undefined} />
      <FormErrorMessage>
        Enter a 24-hour time between 00:00 and 23:59
      </FormErrorMessage>
    </FormControl>

    <FormControl isInvalid>
      <FormLabel>Invalid — minute out of range</FormLabel>
      <TimeInput value="12:75" onChange={() => undefined} />
      <FormErrorMessage>
        Enter a 24-hour time between 00:00 and 23:59
      </FormErrorMessage>
    </FormControl>

    <FormControl isDisabled>
      <FormLabel>Disabled</FormLabel>
      <TimeInput value="18:00" onChange={() => undefined} isDisabled />
    </FormControl>
  </Stack>
)

export const States = StatesTemplate.bind({})
