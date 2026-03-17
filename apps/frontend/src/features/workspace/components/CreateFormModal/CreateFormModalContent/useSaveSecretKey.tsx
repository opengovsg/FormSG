import {
  SyntheticEvent,
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { useTranslation } from 'react-i18next'
import { useClipboard } from '@chakra-ui/react'
import dedent from 'dedent'
import FileSaver from 'file-saver'

/**
 * Contains common logic for handling secret key mailTo, copy, download
 * and whether to allow user to submit (such as verifying that the user has downloaded the secret key).
 */
export const useSaveSecretKey = ({
  secretKey,
  formTitle,
  formId,
  onClose,
  isFormStateValid,
}: {
  secretKey: string
  formTitle: string
  formId: string
  onClose: () => void
  isFormStateValid: boolean
}) => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.workspace.modals.forms.create',
  })

  const mailToHref = useMemo(() => {
    const subject = t('secretKey.email.subject', { titleInputValue: formTitle })
    const body = dedent(
      t('secretKey.email.body', {
        titleInputValue: formTitle,
        secretKey,
      }),
    )
    const href = `mailto:?subject=${encodeURIComponent(
      subject,
    )}&body=${encodeURIComponent(body)}`
    return href
  }, [secretKey, formTitle, t])

  const [hasDownloadedKey, setHasDownloaded] = useState(false)
  const handleDownloadKey = useCallback(() => {
    FileSaver.saveAs(
      new Blob([secretKey], { type: 'text/plain;charset=utf-8' }),
      t('secretKey.email.filename', {
        titleInputValue: formTitle,
        formId,
      }),
    )
    setHasDownloaded(true)
  }, [t, secretKey, formTitle, formId])

  const { hasCopied: hasCopiedKey, onCopy: onCopyKey } = useClipboard(secretKey)
  const handleCopyKey = useCallback(
    (e?: SyntheticEvent) => {
      e?.preventDefault()
      e?.stopPropagation()
      onCopyKey()
    },
    [onCopyKey],
  )

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!hasDownloadedKey) {
        e.preventDefault() // if event doesn't get explicitly handled, default action WILL not be taken
        // returnValue is deprecated, but we return it regardless to support legacy cases (e.g. Chrome/Edge < 119)
        e.returnValue = 'You have not downloaded your Secret Key yet'
      }
    }
    const handlePopState = (e: PopStateEvent) => {
      if (!hasDownloadedKey) {
        window.history.pushState(null, '', window.location.href)
        const confirmMessage =
          "You have not downloaded your Secret Key yet. You won't be able to access your form responses without it. Are you sure you want to leave?"
        if (window.confirm(confirmMessage)) {
          onClose()
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handlePopState)
    window.history.pushState(null, '', window.location.href)

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handlePopState)
    }
  }, [hasDownloadedKey, onClose])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !hasDownloadedKey) {
        e.preventDefault()
        e.stopPropagation()
      }
    }

    document.addEventListener('keydown', handleKeyDown, true)
    return () => document.removeEventListener('keydown', handleKeyDown, true)
  }, [hasDownloadedKey])

  return {
    isSubmitEnabled: isFormStateValid && hasDownloadedKey,
    hasCopiedKey,
    handleCopyKey,
    hasDownloadedKey,
    handleDownloadKey,
    mailToHref,
  }
}
