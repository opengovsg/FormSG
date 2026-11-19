import { useEffect, useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { BiPlus } from 'react-icons/bi'
import { useParams } from 'react-router'
import { Button, useDisclosure } from '@chakra-ui/react'
import Papa from 'papaparse'
import isEmail from 'validator/lib/isEmail'

import { parseCsvFile } from '~utils/parseCsvFile'
import Attachment from '~components/Field/Attachment'
import { downloadFile } from '~components/Field/Attachment/utils/downloadFile'

import { useEditFormField } from '~features/admin-form/create/builder-and-design/mutations/useEditFormField'

import { ConditionalRoutingMappingDeleteModal } from './ConditionalRoutingMappingDeleteModal'
import { ConditionalRoutingOptionModal } from './ConditionalRoutingOptionModal'
import { DropdownFormField } from './dropdownMapping'

export interface ConditionalRoutingConfig {
  csvFile: File | null
}

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

const EMPTY_STATE_ACTION_STYLES = {
  size: 'sm',
  h: 'auto',
  lineHeight: '1.25rem',
} as const

interface DropdownRecipientsMappingProps {
  field: DropdownFormField | undefined
  isLoading: boolean
  onMapped?: () => void
}

export const DropdownRecipientsMapping = ({
  field,
  isLoading,
  onMapped,
}: DropdownRecipientsMappingProps): JSX.Element | null => {
  const { t } = useTranslation()
  const { formId } = useParams()
  const [isDeleteConfirmModalOpen, setIsDeleteConfirmModalOpen] =
    useState(false)
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const { isOpen, onOpen, onClose } = useDisclosure()

  const {
    control: conditionalRoutingConfigControl,
    formState: { errors: conditionalRoutingConfigErrors },
    watch: watchConditionalRoutingConfig,
    handleSubmit,
    setValue: conditionalRoutingConfigSetValue,
  } = useForm<ConditionalRoutingConfig>()

  const fieldTitle = field?.title
  const optionsToRecipientsMap = field?.optionsToRecipientsMap
  const isOptionsToRecipientsMapAttached = !!csvFile

  const standardCsvDownloadFileName = getFileName(formId, fieldTitle)

  const placeholderOptionToEmailMappingCsvFile = useMemo(
    () =>
      ({
        name: standardCsvDownloadFileName,
        type: 'text/csv',
      }) as File,
    [standardCsvDownloadFileName],
  )

  useEffect(() => {
    if (optionsToRecipientsMap) {
      setCsvFile(placeholderOptionToEmailMappingCsvFile)
    } else {
      setCsvFile(null)
    }
  }, [
    setCsvFile,
    placeholderOptionToEmailMappingCsvFile,
    optionsToRecipientsMap,
  ])

  const handleCsvDownload = () => {
    if (!optionsToRecipientsMap) return
    const csvData = {
      fields: ['Options', 'Emails'],
      data: Object.entries(optionsToRecipientsMap).map(
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

  const handleSkeletonCsvDownload = () => {
    const generateCsvContent = (fieldOptions: string[] | undefined) => {
      const headerRow = ['Options', 'Emails']
      const optionsRows = fieldOptions?.map((option) => [option, '']) ?? []
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

    if (!field) return

    const csvContent = generateCsvContent(field.fieldOptions)
    const csvFile = csvStringToFile(csvContent, getFileName(formId, fieldTitle))
    downloadFile(csvFile)
  }

  const { editOptionToRecipientsMutation } = useEditFormField()

  const handleConditionalRoutingConfigSubmit = async (
    data: ConditionalRoutingConfig,
  ) => {
    if (!(data.csvFile && field)) {
      return
    }

    const conditionalRoutingCsvRows = await parseConditionalRoutingTemplateCsv(
      data.csvFile,
    ).catch(() => {
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
        fieldId: field._id,
        optionsToRecipientsMap: csvToOptionsToRecipientsMap(
          conditionalRoutingCsvRows,
        ),
        fieldOptions: getOptionsFromCsv(conditionalRoutingCsvRows),
      },
      {
        onSuccess: () => {
          setCsvFile(placeholderOptionToEmailMappingCsvFile)
          onMapped?.()
          onClose()
        },
      },
    )
  }

  const removeOptionsToRecipientsMapping = () => {
    if (!field) return
    editOptionToRecipientsMutation.mutate(
      {
        fieldId: field._id,
        optionsToRecipientsMap: {},
        fieldOptions: field.fieldOptions,
      },
      {
        onSuccess: () => {
          setCsvFile(null)
          setIsDeleteConfirmModalOpen(false)
        },
      },
    )
  }

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
  }

  const handleOpenModal = () => {
    conditionalRoutingConfigSetValue('csvFile', null)
    onOpen()
  }

  if (!field) return null

  return (
    <>
      <ConditionalRoutingMappingDeleteModal
        isOpen={isDeleteConfirmModalOpen}
        onClose={() => setIsDeleteConfirmModalOpen(false)}
        handleDelete={removeOptionsToRecipientsMapping}
      />
      <ConditionalRoutingOptionModal
        isLoading={isLoading}
        isOpen={isOpen}
        onClose={onClose}
        control={conditionalRoutingConfigControl}
        errors={conditionalRoutingConfigErrors}
        onDownloadCsvClick={handleSkeletonCsvDownload}
        onSubmit={handleSubmit(handleConditionalRoutingConfigSubmit)}
        isSubmitDisabled={!watchConditionalRoutingConfig().csvFile}
        validateCsvFile={validateCsvFile}
        existingCsv={csvFile}
      />
      {isOptionsToRecipientsMapAttached ? (
        <Attachment
          name={`csvFile-${field._id}`}
          onChange={() => {}}
          value={csvFile}
          showDownload
          showRemove={false}
          showReplace
          handleDownloadFileOverride={handleCsvDownload}
          handleRemoveFileOverride={() => setIsDeleteConfirmModalOpen(true)}
          handleReplaceFileOverride={handleOpenModal}
          accept={['.csv']}
        />
      ) : (
        <Button
          w="100%"
          variant="outline"
          {...EMPTY_STATE_ACTION_STYLES}
          leftIcon={<BiPlus />}
          onClick={handleOpenModal}
        >
          {t(
            'features.adminForm.sidebar.workflow.conditionalRouting.addEmailsToOptions',
          )}
        </Button>
      )}
    </>
  )
}
