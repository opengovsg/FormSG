import { FormStepWithHeader } from './FormStepWithHeader'

export const ApprovalsBlock = (): JSX.Element => {
  return (
    <FormStepWithHeader
      headerText="Approval step"
      tooltipText="Use this for steps that involve any type of decision, such as reviews or endorsements"
    ></FormStepWithHeader>
  )
}
