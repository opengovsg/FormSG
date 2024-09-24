import { BxsMagicWand } from '~assets/icons/BxsMagicWand'
import Button from '~components/Button'

export const MagicFormButton = ({
  onClick,
}: {
  onClick: () => void
}): JSX.Element => (
  <Button maxW="100%" leftIcon={<BxsMagicWand />} onClick={onClick}>
    Try out Magic Form Builder
  </Button>
)
