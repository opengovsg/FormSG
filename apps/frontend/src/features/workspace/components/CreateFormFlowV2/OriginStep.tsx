import { useState } from 'react'
import { BiRightArrowAlt } from 'react-icons/bi'
import { Box, Stack, Text } from '@chakra-ui/react'

import Button from '~components/Button'

import { FormOriginValue, OriginSelection } from './OriginSelection'

interface OriginStepProps {
  onNext: (selected: FormOriginValue[], othersText: string) => void
}

export const OriginStep = ({ onNext }: OriginStepProps): JSX.Element => {
  const [selected, setSelected] = useState<FormOriginValue[]>([])
  const [othersText, setOthersText] = useState('')

  const isValid =
    selected.length > 0 &&
    (!selected.includes('other') || othersText.trim().length > 0)

  return (
    <Stack spacing="1.5rem" maxW="36rem">
      <Box>
        <Text textStyle="h2" color="secondary.700" mb="0.5rem">
          Where is this being filled today?
        </Text>
      </Box>

      <OriginSelection
        selected={selected}
        onSelectionChange={setSelected}
        othersText={othersText}
        onOthersTextChange={setOthersText}
      />

      <Button
        isDisabled={!isValid}
        rightIcon={<BiRightArrowAlt fontSize="1.5rem" />}
        onClick={() => onNext(selected, othersText)}
        isFullWidth
      >
        Next step
      </Button>
    </Stack>
  )
}
