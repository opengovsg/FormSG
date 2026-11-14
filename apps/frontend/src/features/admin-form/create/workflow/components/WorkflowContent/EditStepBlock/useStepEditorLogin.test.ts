import { useForm } from 'react-hook-form'
import { act, renderHook } from '@testing-library/react'

import {
  AdminMultirespondentFormDto,
  FormAuthType,
  WorkflowType,
} from 'formsg-shared/types'

import { EditStepInputs } from '../../../types'

import { buildWorkflowStep } from './EditStepBlock'
import { useStepEditorLogin } from './useStepEditorLogin'

it.each([FormAuthType.NIL, FormAuthType.CP])(
  'keeps legacy SP unchanged in the save payload after switching to %s and back',
  (otherProvider) => {
    const form = {
      authType: FormAuthType.SP,
      form_fields: [],
      form_logics: [],
      workflow: [
        {
          _id: 'one',
          workflow_type: WorkflowType.Static,
          edit: [],
          emails: [],
        },
      ],
    } as unknown as AdminMultirespondentFormDto
    const { result } = renderHook(() => {
      const formMethods = useForm<EditStepInputs>({
        defaultValues: {
          _id: 'one',
          workflow_type: WorkflowType.Static,
          edit: [],
          step_name: 'Applicant',
        },
      })
      const login = useStepEditorLogin({
        form,
        formMethods,
        stepNumber: 0,
        isDisabled: false,
      })
      return { ...login, formMethods }
    })
    act(() => result.current.requestSwitch(otherProvider))
    expect(result.current.login.auth_type).toBe(otherProvider)
    act(() => result.current.requestSwitch(FormAuthType.SP))
    expect(result.current.login.auth_type).toBe(FormAuthType.SP)
    const payload = buildWorkflowStep(
      result.current.formMethods.getValues(),
      true,
    )
    expect(payload).not.toHaveProperty('first_step_login')
  },
)
