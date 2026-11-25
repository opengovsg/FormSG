import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { FormControl, Skeleton, Stack, Text } from '@chakra-ui/react'

import {
  FormCompatibilityOptions,
  FormResponseMode,
  LEGACY_OR_LATEST,
} from 'formsg-shared/types/form/form'

import { SingleSelect } from '~components/Dropdown'
import FormLabel from '~components/FormControl/FormLabel'

import { useMutateFormSettings } from '../mutations'
import { useAdminFormSettings } from '../queries'

const I18N_PREFIX =
  'features.adminForm.settings.webhooks.compatibility' as const
const DEFAULT_VALUE = 'default' as const

type LegacyOrLatest = (typeof LEGACY_OR_LATEST)[number]

type CompatibilityOptionKey = {
  group: 'emails' | 'json'
  option: 'format' | 'prefixes'
  label: 'emailFormat' | 'emailPrefixes' | 'jsonPrefixes'
}

const OPTIONS_BY_RESPONSE_MODE: Partial<
  Record<FormResponseMode, CompatibilityOptionKey[]>
> = {
  [FormResponseMode.Encrypt]: [
    { group: 'emails', option: 'format', label: 'emailFormat' },
  ],
  [FormResponseMode.Multirespondent]: [
    { group: 'emails', option: 'prefixes', label: 'emailPrefixes' },
    { group: 'json', option: 'prefixes', label: 'jsonPrefixes' },
  ],
}

const getOptionValue = (
  compatibilityOptions: FormCompatibilityOptions | undefined,
  { group, option }: CompatibilityOptionKey,
): string => {
  const groupOptions = compatibilityOptions?.[group] as
    | Record<string, LegacyOrLatest | null | undefined>
    | undefined
  return groupOptions?.[option] ?? DEFAULT_VALUE
}

export const CompatibilityOptionsSection = (): JSX.Element | null => {
  const { t } = useTranslation()
  const { data: settings, isLoading } = useAdminFormSettings()
  const { mutateFormCompatibilityOptions } = useMutateFormSettings()

  const items = useMemo(
    () =>
      [DEFAULT_VALUE, ...LEGACY_OR_LATEST].map((value) => ({
        value,
        label: t(`${I18N_PREFIX}.options.${value}`),
      })),
    [t],
  )

  const optionKeys = settings
    ? (OPTIONS_BY_RESPONSE_MODE[settings.responseMode] ?? [])
    : []
  if (!isLoading && optionKeys.length === 0) return null

  const handleChange = (key: CompatibilityOptionKey, value: string) => {
    if (mutateFormCompatibilityOptions.isLoading) return
    mutateFormCompatibilityOptions.mutate({
      [key.group]: {
        [key.option]: value === DEFAULT_VALUE ? null : value,
      },
    })
  }

  return (
    <Skeleton isLoaded={!isLoading}>
      <Stack spacing="1.5rem">
        <Stack spacing="0.5rem">
          <Text textStyle="subhead-1" color="base.content.strong">
            {t(`${I18N_PREFIX}.title`)}
          </Text>
          <Text textStyle="body-2" color="base.content.medium">
            {t(`${I18N_PREFIX}.description`)}
          </Text>
        </Stack>
        {optionKeys.map((key) => {
          const name = `compatibility-${key.group}-${key.option}`
          return (
            <FormControl
              key={name}
              id={name}
              isDisabled={mutateFormCompatibilityOptions.isLoading}
            >
              <FormLabel>{t(`${I18N_PREFIX}.${key.label}`)}</FormLabel>
              <SingleSelect
                name={name}
                items={items}
                value={getOptionValue(settings?.compatibilityOptions, key)}
                isClearable={false}
                onChange={(value) => handleChange(key, value)}
              />
            </FormControl>
          )
        })}
      </Stack>
    </Skeleton>
  )
}
