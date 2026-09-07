import { useTranslation } from 'react-i18next'
import { BiDownload } from 'react-icons/bi'

import { useIsMobile } from '~hooks/useIsMobile'
import Menu from '~components/Menu'

import { useGoLinkQrCodeDownload } from '~features/link-shortener/qr/useGoLinkQrCodeDownload'

export interface GoLinkQrCodeMenuProps {
  shortLink: string
}

export const GoLinkQrCodeMenu = ({
  shortLink,
}: GoLinkQrCodeMenuProps): JSX.Element => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.share',
  })
  const { downloadQrCode, downloadingFormat } =
    useGoLinkQrCodeDownload(shortLink)
  // Below md, the Go-link row (see ShareFormModal) wraps this control onto
  // its own line since it can no longer fit beside the input — stretch it
  // full-width there so it reads as a deliberate action row instead of a
  // detached, unlabelled blob, and keep the label visible now that it has
  // room. This also frees the input's row of any competition for width, so
  // the go-link suffix stops being squeezed/truncated on mobile.
  const isMobile = useIsMobile()

  return (
    <Menu placement="bottom-end">
      {() => (
        <>
          <Menu.Button
            colorScheme="secondary"
            leftIcon={<BiDownload fontSize="1.25rem" />}
            isLoading={!!downloadingFormat}
            aria-label={t('goLink.qr.ariaLabel')}
            isStretch={isMobile}
          >
            {t('goLink.qr.menuLabel')}
          </Menu.Button>
          <Menu.List>
            <Menu.Item onClick={() => downloadQrCode('png')}>
              {t('goLink.qr.downloadPng')}
            </Menu.Item>
            <Menu.Item onClick={() => downloadQrCode('svg')}>
              {t('goLink.qr.downloadSvg')}
            </Menu.Item>
          </Menu.List>
        </>
      )}
    </Menu>
  )
}
