import { Wrap } from '@chakra-ui/react'

import { FormCondition } from '~shared/types/form'

import { LogicBadge } from './LogicBadge'

interface LogicConditionValuesProps {
  value: FormCondition['value']
}

export const LogicConditionValues = ({
  value,
}: LogicConditionValuesProps): JSX.Element => {
  if (!Array.isArray(value)) {
    return <LogicBadge>{value}</LogicBadge>
  }

  return (
    <Wrap shouldWrapChildren spacing="0.25rem">
      {value.map((v, index) => (
        <LogicBadge key={index}>{v}</LogicBadge>
      ))}
    </Wrap>
  )
}
