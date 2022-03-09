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
    <>
      {value.map((v) => (
        <LogicBadge>{v}</LogicBadge>
      ))}
    </>
  )
}
