import { Box, Divider, Grid, Stack, Text, Wrap } from '@chakra-ui/react'

import { LogicDto } from '~shared/types/form'

import { isShowFieldsLogic } from '~features/admin-form-builder/logic/utils'

import { useBuilderLogic } from '../../../BuilderLogicContext'

import { FieldLogicBadge } from './FieldLogicBadge'
import { LogicConditionValues } from './LogicConditionValues'

interface LogicBlockProps {
  logic: LogicDto
}

export const LogicBlock = ({ logic }: LogicBlockProps): JSX.Element => {
  const { mapIdToField } = useBuilderLogic()

  return (
    <Box
      borderRadius="4px"
      bg="white"
      border="1px solid"
      borderColor="neutral.200"
    >
      <Grid
        gridTemplateColumns={{
          base: 'minmax(100%, 1fr)',
          md: 'max-content 1fr',
        }}
        alignItems="start"
        columnGap="2rem"
        py="1.5rem"
        px={{ base: '1.5rem', md: '2rem' }}
      >
        {logic.conditions.map((condition, index) => (
          <>
            <Text textStyle="subhead-2" lineHeight="1.5rem">
              {index === 0 ? 'If' : 'and'}
            </Text>
            <FieldLogicBadge field={mapIdToField[condition.field]} />
            <Text
              mt="0.25rem"
              mb={{ md: '1rem' }}
              textStyle="subhead-2"
              lineHeight="1.5rem"
            >
              {condition.state}
            </Text>
            <Wrap
              shouldWrapChildren
              mt="0.25rem"
              mb={{ base: '1.5rem', md: '1rem' }}
              spacing="0.25rem"
            >
              <LogicConditionValues value={condition.value} />
            </Wrap>
          </>
        ))}

        <Divider
          mt={{ base: 0, md: '0.5rem' }}
          mb="1.5rem"
          // Padding and margin to extend beyond grid gap
          mx={{ base: '-1.5rem', md: '-2rem' }}
          px={{ base: '1.5rem', md: '2rem' }}
          gridColumnStart={{ md: 'span 2' }}
        />
        <Text textStyle="subhead-2" lineHeight="1.5rem">
          then show
        </Text>
        <Stack direction="column" spacing="0.25rem">
          {isShowFieldsLogic(logic) &&
            logic.show.map((fieldId) => (
              <FieldLogicBadge field={mapIdToField[fieldId]} />
            ))}
        </Stack>
      </Grid>
    </Box>
  )
}
