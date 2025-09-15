import { RefObject, createRef, useCallback, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { useTranslation } from 'react-i18next'
import { useThrottle } from 'react-use'
import { Box, MenuButton, Text, useDisclosure } from '@chakra-ui/react'
import simplur from 'simplur'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'
import { BxsChevronUp } from '~assets/icons/BxsChevronUp'
import { useTimeout } from '~hooks/useTimeout'
import { useToast } from '~hooks/useToast'
import Button from '~components/Button'
import Menu from '~components/Menu'
import { NavigationPrompt } from '~templates/NavigationPrompt'

import { useStorageResponsesContext } from '../StorageResponsesContext'
import { CanceledResult, DownloadResult } from '../types'
import useDecryptionWorkers from '../useDecryptionWorkers'

import { getAllDecryptedSubmission } from '~features/admin-form/responses/AdminSubmissionsService'
import { useAdminForm } from '~features/admin-form/common/queries'
import { useReactToPrint } from 'react-to-print'
import html2pdf from 'html2pdf.js'
import  { PdfResponseContainer } from '~features/admin-form/responses/IndividualResponsePage/PrintableResponse'
import { DownloadWithAttachmentModal } from './DownloadWithAttachmentModal'
import { ProgressModal } from './ProgressModal'
import { FormResponseMode } from '~shared/types/form'

export const DownloadButton = (): JSX.Element => {
  const {
    isOpen: isDownloadModalOpen,
    onClose: onDownloadModalClose,
    onOpen: onDownloadModalOpen,
  } = useDisclosure({
    // Reset metadata if it exists.
    onOpen: () => setDownloadMetadata(undefined),
  })
  const {
    isOpen: isProgressModalOpen,
    onClose: onProgressModalClose,
    onOpen: onProgressModalOpen,
  } = useDisclosure({
    // Reset metadata if it exists.
    onOpen: () => setDownloadMetadata(undefined),
  })
  const { data: form } = useAdminForm()

  const toast = useToast({
    isClosable: true,
  })

  const [progressModalTimeout, setProgressModalTimeout] = useState<
    number | null
  >(null)
  const { secretKey, dateRange, downloadParams, dateRangeResponsesCount } =
    useStorageResponsesContext()

  const [_downloadCount, setDownloadCount] = useState(0)
  const downloadCount = useThrottle(_downloadCount, 1000)

  const downloadPercentage = useMemo(() => {
    if (!dateRangeResponsesCount) return 0
    return Math.floor((downloadCount / dateRangeResponsesCount) * 100)
  }, [downloadCount, dateRangeResponsesCount])

  useTimeout(onProgressModalOpen, progressModalTimeout)

  const [downloadMetadata, setDownloadMetadata] = useState<
    DownloadResult | CanceledResult
  >()

  const { handleExportCsvMutation, abortDecryption } = useDecryptionWorkers({
    onProgress: setDownloadCount,
    mutateProps: {
      onMutate: () => {
        // Reset metadata if it exists.
        setDownloadMetadata(undefined)
      },
      onSuccess: ({ successCount, expectedCount, errorCount }) => {
        if (downloadParams?.responsesCount === 0) {
          toast({
            description: 'No responses to download',
          })
          return
        }
        if (errorCount > 0) {
          toast({
            status: 'warning',
            description: simplur`Partial success. ${successCount}/${expectedCount} ${[
              successCount,
            ]}response[|s] [was|were] decrypted. ${errorCount} failed.`,
          })
          return
        }
        toast({
          description: simplur`Success. ${successCount}/${expectedCount} ${[
            successCount,
          ]}response[|s] [was|were] decrypted.`,
        })
      },
      onError: () => {
        toast({
          status: 'danger',
          description: 'Failed to start download. Please try again later.',
        })
      },
      onSettled: (decryptResult) => {
        setProgressModalTimeout(null)
        setDownloadMetadata(decryptResult)
      },
    },
  })

  const printableRef = useRef<RefObject<HTMLDivElement>[]>([])
  const currentlyPrintingSubmissionId = useRef<string>('')
  const isReadyForNext = useRef(true)
  const useReactToPrintFn = useReactToPrint({
    onAfterPrint: () => {
      isReadyForNext.current = true
    },
    print: async (printIframe: HTMLIFrameElement) => {
      const HIGH_QUALITY_OPTIONS = {
        margin: 0,
        filename: `${form?.title}-${form?._id}-submission-${currentlyPrintingSubmissionId.current}.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' },
      }

      const document = printIframe.contentDocument
      if (document) {
				const html = document.getElementsByTagName('html')[0];
				await html2pdf().from(html).set(HIGH_QUALITY_OPTIONS).save();
      }
    },
  })

  const handleDownloadAsPdfs = useCallback(async () => {
    if (!form) return
    const { _id: formId, title } = form
    const decryptedSubmissions = await getAllDecryptedSubmission({
      formId,
      secretKey,
      startDate: dateRange[0],
      endDate: dateRange[1],
    })

    printableRef.current = decryptedSubmissions.map(() => createRef<HTMLDivElement>())

    // Create temporary div to render PrintableResponse
    const tempDiv = document.createElement('div')
    const root = createRoot(tempDiv)
    
    root.render(
      <>
      {decryptedSubmissions.map((submission, index) => (
        <PdfResponseContainer
          ref={printableRef.current[index]}
          title={title}
          formId={formId}
          decryptedResponses={submission.responses}
        />
      ))}
      </>
    )

    // Wait for refs to be populated and forwarded - this indicates that the pdf components have been rendered
    await Promise.all(printableRef.current.map(ref => new Promise(resolve => {
      if (ref.current) {
        resolve(true)
      } else {
        const checkRef = () => {
          if (ref.current) {
            resolve(true)
          } else {
            setTimeout(checkRef, 250)
          }
        }
        checkRef()
      }
    })))

    for (const [index, ref] of printableRef.current.entries()) {
      // Lock and wait for previous pdf to be printed
      while (!isReadyForNext.current) {
        await new Promise(resolve => setTimeout(resolve, 250))
      }      
      isReadyForNext.current = false
      currentlyPrintingSubmissionId.current = decryptedSubmissions[index].submissionId
      // Print each pdf
      useReactToPrintFn(() => ref.current)
    }
    
    // Cleanup
    root.unmount()
    tempDiv.remove()

    toast({
      description: `${decryptedSubmissions.length} PDFs downloaded successfully`,
    })
  }, [form, secretKey, dateRange, toast])

  const handleExportCsvNoAttachments = useCallback(() => {
    if (!downloadParams) return
    setProgressModalTimeout(5000)
    return handleExportCsvMutation.mutate({
      ...downloadParams,
      downloadAttachments: false,
    })
  }, [downloadParams, handleExportCsvMutation])

  const handleExportCsvWithAttachments = useCallback(() => {
    if (!downloadParams) return
    return handleExportCsvMutation.mutate({
      ...downloadParams,
      downloadAttachments: true,
    })
  }, [downloadParams, handleExportCsvMutation])

  const resetDownload = useCallback(() => {
    setDownloadCount(0)
    setProgressModalTimeout(null)
    abortDecryption()
    onProgressModalClose()
  }, [abortDecryption, onProgressModalClose])

  const handleModalClose = useCallback(() => {
    resetDownload()
    onDownloadModalClose()
    onProgressModalClose()
    setDownloadMetadata(undefined)
  }, [onDownloadModalClose, onProgressModalClose, resetDownload])

  const handleNoAttachmentsDownloadCancel = useCallback(() => {
    handleModalClose()
    toast({
      status: 'warning',
      description: 'Responses download has been canceled.',
    })
    setDownloadMetadata({ isCanceled: true })
  }, [handleModalClose, toast])

  const handleAttachmentsDownloadCancel = useCallback(() => {
    resetDownload()
    setDownloadMetadata({ isCanceled: true })
  }, [resetDownload])

  const { t } = useTranslation()

  return (
    <>
      <NavigationPrompt
        title={t(
          'features.adminForm.responses.responsesPage.storage.unlockedResponses.downloadButton.navigateAwayPrompt.title',
        )}
        description={t(
          'features.adminForm.responses.responsesPage.storage.unlockedResponses.downloadButton.navigateAwayPrompt.description',
        )}
        confirmButtonText={t(
          'features.adminForm.responses.responsesPage.storage.unlockedResponses.downloadButton.navigateAwayPrompt.confirmButtonText',
        )}
        when={handleExportCsvMutation.isLoading}
      />
      {dateRangeResponsesCount !== undefined && (
        <DownloadWithAttachmentModal
          responsesCount={dateRangeResponsesCount}
          isOpen={isDownloadModalOpen}
          onClose={handleModalClose}
          onDownload={handleExportCsvWithAttachments}
          onCancel={handleAttachmentsDownloadCancel}
          downloadPercentage={downloadPercentage}
          isDownloading={handleExportCsvMutation.isLoading}
          downloadMetadata={downloadMetadata}
        />
      )}
      {dateRangeResponsesCount !== undefined && (
        <ProgressModal
          isOpen={isProgressModalOpen}
          onClose={handleModalClose}
          onCancel={handleNoAttachmentsDownloadCancel}
          downloadPercentage={downloadPercentage}
          downloadMetadata={downloadMetadata}
        >
          <Text mb="1rem">
            {t(
              'features.adminForm.responses.responsesPage.storage.unlockedResponses.downloadButton.progressModalContent',
              {
                dateRangeResponsesCount: (
                  <b>{dateRangeResponsesCount.toLocaleString()}</b>
                ),
              },
            )}
          </Text>
        </ProgressModal>
      )}
      <Box gridArea="export" justifySelf="flex-end">
        <Menu placement="bottom-end">
          {({ isOpen }) => (
            <>
              <MenuButton
                as={Button}
                isDisabled={!downloadParams}
                isLoading={handleExportCsvMutation.isLoading}
                isActive={isOpen}
                aria-label={t(
                  'features.adminForm.responses.responsesPage.storage.unlockedResponses.downloadButton.label',
                )}
                rightIcon={isOpen ? <BxsChevronUp /> : <BxsChevronDown />}
              >
                {t('features.common.download')}
              </MenuButton>
              <Menu.List>
                <Menu.Item onClick={handleExportCsvNoAttachments}>
                  {t(
                    'features.adminForm.responses.responsesPage.storage.unlockedResponses.downloadButton.menuItem.csvOnly',
                  )}
                </Menu.Item>
                <Menu.Item onClick={onDownloadModalOpen}>
                  {t(
                    'features.adminForm.responses.responsesPage.storage.unlockedResponses.downloadButton.menuItem.csvWithAttachments',
                  )}
                </Menu.Item>
                {form?.responseMode === FormResponseMode.Encrypt && (
                  <Menu.Item onClick={handleDownloadAsPdfs}>As PDF</Menu.Item>
                )}
              </Menu.List>
            </>
          )}
        </Menu>
      </Box>
    </>
  )
}
