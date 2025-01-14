import {
  KeyboardEventHandler,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { FormControl, Skeleton } from '@chakra-ui/react'

import { FormResponseMode } from '~shared/types'

import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import FormLabel from '~components/FormControl/FormLabel'
import InlineMessage from '~components/InlineMessage'
import NumberInput from '~components/NumberInput'
import Toggle from '~components/Toggle'

import { useFormResponsesCount } from '~features/admin-form/responses/queries'

import { useMutateFormSettings } from '../mutations'
import { useAdminFormSettings } from '../queries'

const DEFAULT_SUBMISSION_LIMIT = 1000

interface FormLimitBlockProps {
  initialLimit: string
  currentResponseCount: number
}
const FormLimitBlock = ({
  initialLimit,
  currentResponseCount,
}: FormLimitBlockProps): JSX.Element => {
  const { t } = useTranslation()
  const [value, setValue] = useState(initialLimit)
  const [error, setError] = useState<string>()

  const inputRef = useRef<HTMLInputElement>(null)
  const { mutateFormLimit } = useMutateFormSettings()

  const handleValueChange = useCallback(
    (val: string) => {
      // Only allow numeric inputs and remove leading zeroes.
      const nextVal = val.replace(/^0+|\D/g, '')
      setValue(nextVal)
      if (parseInt(nextVal, 10) <= currentResponseCount) {
        setError(
          t('features.adminForm.settings.general.limit.limitLessThanCurrent', {
            currentResponseCount,
          }),
        )
      } else if (error) {
        setError(undefined)
      }
    },
    [currentResponseCount, error, t],
  )

  const handleBlur = useCallback(() => {
    if (error) {
      setError(undefined)
    }
    if (value === initialLimit) return
    const valueInt = parseInt(value, 10)
    if (value === '' || valueInt <= currentResponseCount) {
      return setValue(initialLimit)
    }

    return mutateFormLimit.mutate(valueInt, {
      onError: () => {
        setValue(initialLimit)
      },
    })
  }, [currentResponseCount, error, initialLimit, mutateFormLimit, value])

  const handleKeydown: KeyboardEventHandler<HTMLInputElement> = useCallback(
    (e) => {
      if (e.key === 'Enter') {
        e.preventDefault()
        inputRef.current?.blur()
      }
    },
    [],
  )

  return (
    <FormControl mt="2rem" isInvalid={!!error}>
      <FormLabel
        isRequired
        description={t(
          'features.adminForm.settings.general.limit.input.description',
        )}
      >
        {t('features.adminForm.settings.general.limit.input.label')}
      </FormLabel>
      <NumberInput
        maxW="16rem"
        ref={inputRef}
        inputMode="numeric"
        showSteppers={false}
        clampValueOnBlur
        precision={0}
        value={value}
        onChange={handleValueChange}
        onKeyDown={handleKeydown}
        onBlur={handleBlur}
      />
      <FormErrorMessage>{error}</FormErrorMessage>
    </FormControl>
  )
}

export const FormLimitToggle = (): JSX.Element => {
  const { t } = useTranslation()
  const { data: settings, isLoading: isLoadingSettings } =
    useAdminFormSettings()

  const isMrf = settings?.responseMode === FormResponseMode.Multirespondent

  const { data: responseCount, isLoading: isLoadingCount } =
    useFormResponsesCount()

  const isLimit = useMemo(
    () => settings && settings?.submissionLimit !== null,
    [settings],
  )

  const { mutateFormLimit } = useMutateFormSettings()

  const handleToggleLimit = useCallback(() => {
    if (
      !settings ||
      isLoadingSettings ||
      isLoadingCount ||
      responseCount === undefined ||
      mutateFormLimit.isLoading
    )
      return

    // Case toggling submissionLimit off.
    if (settings.submissionLimit !== null) {
      return mutateFormLimit.mutate(null)
    }

    // Case toggling submissionLimit on.
    // Allow 1 more response if default submission limit is hit.
    const nextLimit =
      responseCount > DEFAULT_SUBMISSION_LIMIT
        ? responseCount + 1
        : DEFAULT_SUBMISSION_LIMIT
    return mutateFormLimit.mutate(nextLimit)
  }, [
    isLoadingCount,
    isLoadingSettings,
    mutateFormLimit,
    responseCount,
    settings,
  ])

  return (
    <Skeleton isLoaded={!isLoadingSettings && !!settings} mt="2rem">
      <Toggle
        isDisabled={isMrf}
        isLoading={mutateFormLimit.isLoading}
        isChecked={isLimit}
        label={t('features.adminForm.settings.general.limit.label')}
        onChange={() => handleToggleLimit()}
      />
      {isMrf ? (
        <InlineMessage variant="warning" mt="0.5rem">
          {t('features.adminForm.settings.general.limit.notForMRF')}
        </InlineMessage>
      ) : null}
      {settings && settings?.submissionLimit !== null && (
        <Skeleton isLoaded={!isLoadingCount}>
          <FormLimitBlock
            initialLimit={String(settings.submissionLimit)}
            currentResponseCount={responseCount ?? 0}
          />
        </Skeleton>
      )}
    </Skeleton>
  )
}
