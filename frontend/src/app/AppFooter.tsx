import { useTranslation } from 'react-i18next'

import { APP_FOOTER_LINKS } from '~constants/links'
import Footer, { FooterProps } from '~components/Footer'

type AppFooterProps = Pick<
  FooterProps,
  'variant' | 'containerProps' | 'compactMonochromeLogos'
>
export const AppFooter = (props: AppFooterProps): JSX.Element => {
  const { t } = useTranslation()

  return (
    <Footer
      appLink={window.location.origin}
      appName={t('features.app.footer.appName')}
      footerLinks={APP_FOOTER_LINKS}
      {...props}
    />
  )
}
