import { LogicDto, LogicType, ShowFieldLogicDto } from '~shared/types/form'

export const isShowFieldsLogic = (
  formLogic: LogicDto,
): formLogic is ShowFieldLogicDto => {
  return formLogic.logicType === LogicType.ShowFields
}
