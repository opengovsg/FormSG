import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import FileSaver from 'file-saver'

import { useToast } from '~hooks/useToast'

import {
  buildGoLinkQrCodeSvg,
  getGoLinkQrCodeFilename,
  GoLinkQrCodeFormat,
  rasteriseSvgToPngBlob,
} from './goLinkQrCode'

export const useGoLinkQrCodeDownload = (shortLink: string) => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.share',
  })
  const toast = useToast({ status: 'danger' })

  const [downloadingFormat, setDownloadingFormat] = useState<
    GoLinkQrCodeFormat | undefined
  >(undefined)

  const downloadQrCode = useCallback(
    async (format: GoLinkQrCodeFormat) => {
      // A second click while a download is still composing would fire a second
      // save dialog, so only one is ever in flight.
      if (downloadingFormat) return
      setDownloadingFormat(format)
      try {
        const { svg, width, height } = await buildGoLinkQrCodeSvg(shortLink)
        const blob =
          format === 'svg'
            ? new Blob([svg], { type: 'image/svg+xml;charset=utf-8' })
            : await rasteriseSvgToPngBlob(svg, width, height)
        FileSaver.saveAs(blob, getGoLinkQrCodeFilename(shortLink, format))
      } catch {
        toast({ description: t('goLink.qr.downloadError') })
      } finally {
        setDownloadingFormat(undefined)
      }
    },
    [downloadingFormat, shortLink, t, toast],
  )

  return { downloadQrCode, downloadingFormat }
}
