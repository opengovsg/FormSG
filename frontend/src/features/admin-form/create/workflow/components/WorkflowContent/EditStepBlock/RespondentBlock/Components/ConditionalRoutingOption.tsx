import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { BiPlus } from 'react-icons/bi'
import { useParams } from 'react-router'
import {
  Button,
  FormControl,
  Stack,
  Text,
  useDisclosure,
} from '@chakra-ui/react'
import Papa from 'papaparse'
import isEmail from 'validator/lib/isEmail'

import { DropdownFieldBase, FormFieldDto, WorkflowType } from '~shared/types'
import { checkIsOptionsMismatched } from '~shared/utils/options-recipients-map-validation'

import { parseCsvFile } from '~utils/parseCsvFile'
import { SingleSelect } from '~components/Dropdown'
import Attachment from '~components/Field/Attachment'
import { downloadFile } from '~components/Field/Attachment/utils/downloadFile'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import Radio from '~components/Radio'

import { useEditFormField } from '~features/admin-form/create/builder-and-design/mutations/useEditFormField'
import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'
import { FormFieldWithQuestionNo } from '~features/form/types'

import { ConditionalRoutingMappingDeleteModal } from './ConditionalRoutingMappingDeleteModal'
import { ConditionalRoutingOptionModal } from './ConditionalRoutingOptionModal'
import { useWorkflowTypeValidation } from './hooks'
import { RespondentOptionProps } from './types'

interface ConditionalRoutingOptionProps extends RespondentOptionProps {
  conditionalFormFields: FormFieldWithQuestionNo<
    FormFieldDto<DropdownFieldBase>
  >[]
}

export interface ConditionalRoutingConfig {
  csvFile: File | null
}

/**
 * Parses the conditional routing CSV file, validating that it has the required csv template file headers.
 * @param csvFile - The CSV file to parse
 * @returns A promise that resolves to the CSV content as a string
 * @throws Error if CSV headers are invalid (must have 'Options' and 'Emails' columns)
 */
const parseConditionalRoutingTemplateCsv = async (csvFile: File) =>
  parseCsvFile(csvFile, (headerRow) => {
    return {
      isValid:
        headerRow &&
        headerRow.length === 2 &&
        headerRow[0] === 'Options' &&
        headerRow[1] === 'Emails',
      invalidReason:
        'Your CSV file should only contain 2 columns with the headers "Options" and "Emails".',
    }
  })

const getFileName = (
  formId: string | undefined,
  fieldTitle: string | undefined,
) =>
  `conditional_routing_form_${formId ?? ''}_field_${fieldTitle ?? ''}_mapping.csv`

export const ConditionalRoutingOption = ({
  isLoading,
  formMethods,
  selectedWorkflowType,
  conditionalFormFields,
}: ConditionalRoutingOptionProps) => {
  const { t } = useTranslation()
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] =
    useState(false)
  const {
    register,
    control,
    watch,
    getValues,
    formState: { errors },
    clearErrors,
  } = formMethods

  const { formId } = useParams()

  const conditionalFieldItems = conditionalFormFields.map(
    ({ _id, questionNumber, title, fieldType }) => ({
      label: `${questionNumber}. ${title}`,
      value: _id,
      icon: BASICFIELD_TO_DRAWER_META[fieldType].icon,
    }),
  )

  const [csvFile, setCsvFile] = useState<File | null>(null)

  const {
    control: conditionalRoutingConfigControl,
    formState: { errors: conditionalRoutingConfigErrors },
    watch: watchConditionalRoutingConfig,
    handleSubmit,
    setValue: conditionalRoutingConfigSetValue,
  } = useForm<ConditionalRoutingConfig>()

  const selectedConditionalFieldId = watch('conditional_field')
  const selectedConditionalField = conditionalFormFields.find(
    (field) => field._id === selectedConditionalFieldId,
  )
  const isSelectedConditionalFieldFound = !!selectedConditionalField
  const selectedConditionalFieldTitle = selectedConditionalField?.title
  const selectedConditionalFieldOptionsToRecipientsMap =
    selectedConditionalField?.optionsToRecipientsMap

  const isOptionsToRecipientsMapAttached = !!csvFile

  const standardCsvDownloadFileName = getFileName(
    formId,
    selectedConditionalFieldTitle,
  )

  const placeholderOptionToEmailMappingCsvFile = useMemo(
    () =>
      ({
        name: standardCsvDownloadFileName,
        type: 'text/csv',
      }) as File,
    [standardCsvDownloadFileName],
  )

  useEffect(() => {
    if (selectedConditionalFieldOptionsToRecipientsMap) {
      setCsvFile(placeholderOptionToEmailMappingCsvFile)
    } else {
      setCsvFile(null)
    }
  }, [
    setCsvFile,
    placeholderOptionToEmailMappingCsvFile,
    selectedConditionalFieldOptionsToRecipientsMap,
  ])

  const { isOpen, onOpen, onClose } = useDisclosure()

  const handleCsvDownload = () => {
    if (!selectedConditionalFieldOptionsToRecipientsMap) return
    const csvData = {
      fields: ['Options', 'Emails'],
      data: Object.entries(selectedConditionalFieldOptionsToRecipientsMap).map(
        ([option, recipients]) => [option, recipients.join(',')],
      ),
    }

    const csvString = Papa.unparse(csvData, {
      header: true,
      delimiter: ',',
      skipEmptyLines: 'greedy',
    })
    const csvBlob = new Blob([csvString], {
      type: 'text/csv',
    })
    const csvFile = new File([csvBlob], standardCsvDownloadFileName, {
      type: 'text/csv',
    })
    downloadFile(csvFile)
  }

  const handleSkeletonCsvDownload =
    (formId: string = '') =>
    () => {
      const getFieldOptions = (conditionalFieldId: string) => {
        const conditionalField = conditionalFormFields.find(
          (field) => field._id === conditionalFieldId,
        )
        return conditionalField?.fieldOptions
      }
      const generateCsvContent = (fieldOptions: string[] | undefined) => {
        const headerRow = ['Options', 'Emails']
        const optionsRows = fieldOptions?.map((field) => [field, '']) ?? []
        const jsonContent = [headerRow, ...optionsRows]
        return Papa.unparse(jsonContent, {
          header: true,
          delimiter: ',',
        })
      }

      const csvStringToFile = (csvString: string, downloadFileName: string) => {
        const csvBlob = new Blob([csvString], {
          type: 'text/csv',
        })
        const csvFile = new File([csvBlob], downloadFileName, {
          type: 'text/csv',
        })
        return csvFile
      }

      if (!selectedConditionalFieldId) return

      const fieldOptions = getFieldOptions(selectedConditionalFieldId)
      const csvContent = generateCsvContent(fieldOptions)
      const csvFile = csvStringToFile(
        csvContent,
        getFileName(formId, selectedConditionalFieldTitle),
      )
      downloadFile(csvFile)
    }

  const { editOptionToRecipientsMutation } = useEditFormField()

  const handleConditionalRoutingConfigSubmit =
    (conditionalFieldId: string | undefined) =>
    async (data: ConditionalRoutingConfig) => {
      if (!(data.csvFile && conditionalFieldId)) {
        return
      }

      const conditionalRoutingCsvRows =
        await parseConditionalRoutingTemplateCsv(data.csvFile).catch(() => {
          return null
        })

      if (!conditionalRoutingCsvRows) return
      const csvToOptionsToRecipientsMap = (csvRows: string[][]) => {
        return csvRows.reduce((acc, row) => {
          const [option, recipients] = row
          const recipientsArray = recipients.split(',')
          return {
            ...acc,
            [option]: recipientsArray.map((email) => email.trim()),
          }
        }, {})
      }

      const getOptionsFromCsv = (csvRows: string[][]): string[] => {
        return csvRows.map(([option]) => option)
      }

      editOptionToRecipientsMutation.mutate(
        {
          fieldId: conditionalFieldId,
          optionsToRecipientsMap: csvToOptionsToRecipientsMap(
            conditionalRoutingCsvRows,
          ),
          fieldOptions: getOptionsFromCsv(conditionalRoutingCsvRows),
        },
        {
          onSuccess: () => {
            setCsvFile(placeholderOptionToEmailMappingCsvFile)
            clearErrors('conditional_field')
            onClose()
          },
        },
      )
    }

  const removeOptionsToRecipientsMapping = () => {
    if (!selectedConditionalField) return
    editOptionToRecipientsMutation.mutate(
      {
        fieldId: selectedConditionalField._id,
        optionsToRecipientsMap: {},
        fieldOptions: selectedConditionalField.fieldOptions,
      },
      {
        onSuccess: () => {
          setCsvFile(null)
          setIsDeleteConfirmModalOpen(false)
        },
      },
    )
  }

  const validateCsvOptionsWithFieldOptions = (
    optionsToRecipientsMapOptions: string[],
    selectedConditionalFieldOptions: string[],
  ) => {
    if (optionsToRecipientsMapOptions.length <= 0) {
      return
    }
    if (
      checkIsOptionsMismatched(
        optionsToRecipientsMapOptions,
        selectedConditionalFieldOptions,
      )
    ) {
      return t(
        'features.adminForm.sidebar.workflow.conditionalRouting.errors.csv.mismatchedOptions',
      )
    }
  }

  const validateOptionsToRecipientsMapErrorMessage =
    validateCsvOptionsWithFieldOptions(
      [...Object.keys(selectedConditionalFieldOptionsToRecipientsMap || {})],
      selectedConditionalField?.fieldOptions || [],
    )

  const noEmailToOptionsMappingErrorMessage =
    !selectedConditionalFieldOptionsToRecipientsMap
      ? t(
          'features.adminForm.sidebar.workflow.conditionalRouting.errors.csv.addEmailsBeforeSave',
        )
      : null

  const validateCsvFile = async (
    file: File | null,
  ): Promise<string | undefined> => {
    if (!file)
      return t(
        'features.adminForm.sidebar.workflow.conditionalRouting.errors.csv.required',
      )

    let conditionalRoutingCsvRows
    try {
      conditionalRoutingCsvRows = await parseConditionalRoutingTemplateCsv(file)
    } catch (error) {
      if (error instanceof Error) {
        return error.message
      }
      return t(
        'features.adminForm.sidebar.workflow.conditionalRouting.errors.csv.parse',
      )
    }

    const optionsSet = new Set<string>()

    for (const csvRow of conditionalRoutingCsvRows) {
      const [option, recipients] = csvRow
      const recipientsArray = recipients.split(',')
      if (recipientsArray.length <= 0 || !recipientsArray[0] || !option) {
        return t(
          'features.adminForm.sidebar.workflow.conditionalRouting.errors.csv.missingData',
        )
      }
      if (recipientsArray.some((recipient) => !isEmail(recipient.trim()))) {
        return t(
          'features.adminForm.sidebar.workflow.conditionalRouting.errors.csv.invalidFormat',
        )
      }
      optionsSet.add(option)
    }

    if (optionsSet.size < conditionalRoutingCsvRows.length) {
      return t(
        'features.adminForm.sidebar.workflow.conditionalRouting.errors.csv.duplicateOptions',
      )
    }
    return
  }

  const workflowTypeValidation = useWorkflowTypeValidation()

  return (
    <>
      <ConditionalRoutingMappingDeleteModal
        isOpen={isDeleteConfirmModalOpen}
        onClose={() => setIsDeleteConfirmModalOpen(false)}
        handleDelete={removeOptionsToRecipientsMapping}
      />
      <ConditionalRoutingOptionModal
        conditionalFieldItems={conditionalFieldItems}
        isLoading={isLoading}
        isOpen={isOpen}
        onClose={onClose}
        control={conditionalRoutingConfigControl}
        errors={conditionalRoutingConfigErrors}
        onDownloadCsvClick={handleSkeletonCsvDownload(formId)}
        onSubmit={handleSubmit(
          handleConditionalRoutingConfigSubmit(getValues('conditional_field')),
        )}
        isSubmitDisabled={
          !(
            watchConditionalRoutingConfig().csvFile &&
            watch('conditional_field')
          )
        }
        validateCsvFile={validateCsvFile}
        existingCsv={csvFile}
        setValue={conditionalRoutingConfigSetValue}
      />

      <Radio
        isDisabled={isLoading}
        isLabelFullWidth
        allowDeselect={false}
        value={WorkflowType.Conditional}
        {...register('workflow_type', workflowTypeValidation)}
        px="0.5rem"
        __css={{
          _focusWithin: {
            boxShadow: 'none',
          },
        }}
      >
        <Text mb="0.5rem">
          {t('features.adminForm.sidebar.workflow.conditionalRouting.title')}
        </Text>
        {selectedWorkflowType === WorkflowType.Conditional ? (
          <FormControl
            id="conditional_field"
            isRequired
            isInvalid={
              !!validateOptionsToRecipientsMapErrorMessage ||
              !!errors.conditional_field
            }
          >
            <Stack spacing="0.625rem">
              <Controller
                control={control}
                name="conditional_field"
                rules={{
                  required: t(
                    'features.adminForm.sidebar.workflow.conditionalRouting.validation.noField',
                  ),
                  validate: (selectedValue) => {
                    if (noEmailToOptionsMappingErrorMessage) {
                      return noEmailToOptionsMappingErrorMessage
                    }
                    if (validateOptionsToRecipientsMapErrorMessage) {
                      return validateOptionsToRecipientsMapErrorMessage
                    }
                    return (
                      isLoading ||
                      !conditionalFieldItems ||
                      conditionalFieldItems.some(
                        ({ value: fieldValue }) => fieldValue === selectedValue,
                      ) ||
                      t(
                        'features.adminForm.sidebar.workflow.conditionalRouting.validation.notDropdown',
                      )
                    )
                  },
                }}
                render={({ field: { value = '', ...rest } }) => (
                  <SingleSelect
                    isDisabled={isLoading}
                    isClearable={false}
                    placeholder={t(
                      'features.adminForm.sidebar.workflow.dynamicRespondent.select',
                    )}
                    items={conditionalFieldItems}
                    value={value}
                    {...rest}
                  />
                )}
              />
              {isSelectedConditionalFieldFound ? (
                isOptionsToRecipientsMapAttached ? (
                  <Attachment
                    name={'csvFile'}
                    onChange={() => {}}
                    value={csvFile}
                    showDownload
                    showRemove={false}
                    showReplace
                    handleDownloadFileOverride={handleCsvDownload}
                    handleRemoveFileOverride={() =>
                      setIsDeleteConfirmModalOpen(true)
                    }
                    handleReplaceFileOverride={onOpen}
                    accept={['.csv']}
                  />
                ) : (
                  <Button
                    w="100%"
                    variant="outline"
                    leftIcon={<BiPlus fontSize="1.5rem" />}
                    onClick={onOpen}
                    isDisabled={!isSelectedConditionalFieldFound}
                  >
                    {t(
                      'features.adminForm.sidebar.workflow.conditionalRouting.addEmailsToOptions',
                    )}
                  </Button>
                )
              ) : null}
            </Stack>
            <FormErrorMessage>
              {validateOptionsToRecipientsMapErrorMessage ||
                errors.conditional_field?.message}
            </FormErrorMessage>
          </FormControl>
        ) : null}
      </Radio>
    </>
  )
}
