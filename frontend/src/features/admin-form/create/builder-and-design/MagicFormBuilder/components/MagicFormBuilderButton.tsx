import { useTranslation } from 'react-i18next'
import { BiSolidMagicWand } from 'react-icons/bi'

import Button from '~components/Button'

const MagicFormBuilderButton = ({
  onClick,
}: {
  onClick: () => void
}): JSX.Element => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.magicFormBuilder.button',
  })

  return (
    <Button
      maxW="100%"
      rightIcon={<BiSolidMagicWand fontSize="1.5rem" />}
      onClick={onClick}
      isTruncated
    >
      {t('createFields')}
    </Button>
  )
}

export default MagicFormBuilderButton
