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
  // The claimed-link row is already tight on a phone; the label would squeeze
  // the suffix out of view, so the icon and aria-label carry it there.
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
          >
            {isMobile ? null : t('goLink.qr.menuLabel')}
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
