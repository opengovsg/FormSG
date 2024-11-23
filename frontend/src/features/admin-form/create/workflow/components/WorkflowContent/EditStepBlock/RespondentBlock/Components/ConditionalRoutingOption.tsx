import { useEffect, useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
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

import {
  CONDITIONAL_ROUTING_DUPLICATE_OPTIONS_ERROR_MESSAGE,
  CONDITIONAL_ROUTING_EMAILS_OPTIONS_MISSING_ERROR_MESSAGE,
  CONDITIONAL_ROUTING_INVALID_CSV_FORMAT_ERROR_MESSAGE,
  CONDITIONAL_ROUTING_MISMATCHED_OPTIONS_ERROR_MESSAGE,
} from '~shared/constants/errors'
import { DropdownFieldBase, FormFieldDto, WorkflowType } from '~shared/types'
import { checkIsOptionsMismatched } from '~shared/utils/options-recipients-map-validation'

import { parseCsvFileToCsvString } from '~utils/parseCsvFileToCsvString'
import { SingleSelect } from '~components/Dropdown'
import Attachment from '~components/Field/Attachment'
import { downloadFile } from '~components/Field/Attachment/utils/downloadFile'
import FormErrorMessage from '~components/FormControl/FormErrorMessage'
import Radio from '~components/Radio'

import { useEditFormField } from '~features/admin-form/create/builder-and-design/mutations/useEditFormField'
import { BASICFIELD_TO_DRAWER_META } from '~features/admin-form/create/constants'
import { FormFieldWithQuestionNo } from '~features/form/types'

import { WORKFLOW_TYPE_VALIDATION } from './common'
import { ConditionalRoutingMappingDeleteModal } from './ConditionalRoutingMappingDeleteModal'
import { ConditionalRoutingOptionModal } from './ConditionalRoutingOptionModal'
import { RespondentOptionProps } from './types'

interface ConditionalRoutingOptionProps extends RespondentOptionProps {
  conditionalFormFields: FormFieldWithQuestionNo<
    FormFieldDto<DropdownFieldBase>
  >[]
}

export interface ConditionalRoutingConfig {
  csvFile: File | null
}

export const ConditionalRoutingOption = ({
  isLoading,
  formMethods,
  selectedWorkflowType,
  conditionalFormFields,
}: ConditionalRoutingOptionProps) => {
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
  } = useForm<ConditionalRoutingConfig>()

  const selectedConditionalFieldId = watch('conditional_field')
  const isConditionalFieldSelected = !!selectedConditionalFieldId
  const selectedConditionalField = conditionalFormFields.find(
    (field) => field._id === selectedConditionalFieldId,
  )

  const selectedConditionalFieldTitle = selectedConditionalField?.title
  const selectedConditionalFieldOptionsToRecipientsMap =
    selectedConditionalField?.optionsToRecipientsMap

  const isOptionsToRecipientsMapAttached = !!csvFile

  const standardCsvDownloadFileName = `conditional_routing_form_${formId}_field_${selectedConditionalFieldTitle}_mapping.csv`

  const placeholderOptionToEmailMappingCsv = useMemo(() => {
    return {
      name: standardCsvDownloadFileName,
      type: 'text/csv',
    } as File
  }, [standardCsvDownloadFileName])

  useEffect(() => {
    if (selectedConditionalFieldOptionsToRecipientsMap) {
      setCsvFile(placeholderOptionToEmailMappingCsv)
    } else {
      setCsvFile(null)
    }
  }, [
    placeholderOptionToEmailMappingCsv,
    setCsvFile,
    selectedConditionalFieldOptionsToRecipientsMap,
  ])

  const { isOpen, onOpen, onClose } = useDisclosure()

  const handleCsvDownload = () => {
    if (!selectedConditionalFieldOptionsToRecipientsMap) return
    const csvData = {
      fields: ['Options', 'Add email(s) in this column'],
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
        const headerRow = ['Options', 'Add email(s) in this column']
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
        `conditional_routing_form_${formId}_field_${selectedConditionalFieldTitle}_mapping.csv`,
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

      const conditionalRoutingCsvString = await parseCsvFileToCsvString(
        data.csvFile,
        (headerRow) => {
          return {
            isValid:
              headerRow &&
              headerRow.length === 2 &&
              headerRow[0] === 'Options' &&
              headerRow[1] === 'Add email(s) in this column',
            invalidReason:
              'Your CSV file should only contain 2 columns with the "Options" and "Add email(s) in this column" headers.',
          }
        },
      )
      const csvToOptionsToRecipientsMap = (csvString: string) => {
        const csvRows = csvString.split('\r\n')
        return csvRows.reduce((acc, row) => {
          const [option, ...recipients] = row.split(',')
          return {
            ...acc,
            [option]: recipients,
          }
        }, {})
      }

      editOptionToRecipientsMutation.mutate(
        {
          fieldId: conditionalFieldId,
          optionsToRecipientsMap: csvToOptionsToRecipientsMap(
            conditionalRoutingCsvString,
          ),
        },
        {
          onSuccess: () => {
            setCsvFile(placeholderOptionToEmailMappingCsv)
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
      },
      {
        onSuccess: () => {
          setCsvFile(null)
          setIsDeleteConfirmModalOpen(false)
        },
      },
    )
  }

  const validateOptions = (
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
      return CONDITIONAL_ROUTING_MISMATCHED_OPTIONS_ERROR_MESSAGE
    }
  }

  const validateOptionsToRecipientsMapErrorMessage = validateOptions(
    [...Object.keys(selectedConditionalFieldOptionsToRecipientsMap || {})],
    selectedConditionalField?.fieldOptions || [],
  )

  const noEmailToOptionsMappingErrorMessage =
    !selectedConditionalFieldOptionsToRecipientsMap
      ? 'You must add email(s) to options before saving this step'
      : null

  const validateCsvFile = async (
    file: File | null,
  ): Promise<string | undefined> => {
    if (!file) return 'Please upload a CSV file'

    let conditionalRoutingCsvString
    try {
      conditionalRoutingCsvString = await parseCsvFileToCsvString(
        file,
        (headerRow) => {
          return {
            isValid:
              headerRow &&
              headerRow.length === 2 &&
              headerRow[0] === 'Options' &&
              headerRow[1] === 'Add email(s) in this column',
            invalidReason:
              'Your CSV file should only contain 2 columns with the "Options" and "Add email(s) in this column" headers',
          }
        },
      )
    } catch (error) {
      return (error as Error).message
    }

    const options = conditionalRoutingCsvString.split('\r\n')
    const optionsSet = new Set<string>()

    for (const row of options) {
      const [option, ...recipients] = row.split(',')
      if (recipients.length <= 0 || !recipients[0] || !option) {
        return CONDITIONAL_ROUTING_EMAILS_OPTIONS_MISSING_ERROR_MESSAGE
      }
      if (recipients.some((recipient) => !isEmail(recipient))) {
        return CONDITIONAL_ROUTING_INVALID_CSV_FORMAT_ERROR_MESSAGE
      }
      optionsSet.add(option)
    }

    const selectedConditionalFieldOptions =
      selectedConditionalField?.fieldOptions

    if (optionsSet.size < options.length) {
      return CONDITIONAL_ROUTING_DUPLICATE_OPTIONS_ERROR_MESSAGE
    }

    return validateOptions(
      [...optionsSet],
      selectedConditionalFieldOptions || [],
    )
  }

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
      />

      <Radio
        isDisabled={isLoading}
        isLabelFullWidth
        allowDeselect={false}
        value={WorkflowType.Conditional}
        {...register('workflow_type', WORKFLOW_TYPE_VALIDATION)}
        px="0.5rem"
        __css={{
          _focusWithin: {
            boxShadow: 'none',
          },
        }}
      >
        <Text mb="0.5rem">
          Email(s) assigned to options in a dropdown or radio field
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
                  required: 'Please select a field',
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
                      'Field is not an dropdown field'
                    )
                  },
                }}
                render={({ field: { value = '', ...rest } }) => (
                  <SingleSelect
                    isDisabled={isLoading}
                    isClearable={false}
                    placeholder="Select a field"
                    items={conditionalFieldItems}
                    value={value}
                    {...rest}
                  />
                )}
              />
              {isConditionalFieldSelected ? (
                isOptionsToRecipientsMapAttached ? (
                  <Attachment
                    name={'csvFile'}
                    onChange={() => {}}
                    value={csvFile}
                    showDownload
                    showRemove
                    handleDownloadFileOverride={handleCsvDownload}
                    handleRemoveFileOverride={() =>
                      setIsDeleteConfirmModalOpen(true)
                    }
                    accept={['.csv']}
                  />
                ) : (
                  <Button
                    w="100%"
                    variant="outline"
                    leftIcon={<BiPlus fontSize="1.5rem" />}
                    onClick={onOpen}
                    isDisabled={!isConditionalFieldSelected}
                  >
                    Add email(s) to options
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
