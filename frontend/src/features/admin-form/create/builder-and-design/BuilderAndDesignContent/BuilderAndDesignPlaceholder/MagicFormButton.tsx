import { BxsMagicWand } from '~assets/icons/BxsMagicWand'
import Button from '~components/Button'

export const MagicFormButton = ({
  onClick,
}: {
  onClick: () => void
}): JSX.Element => {
  return (
    <Button maxW="100%" rightIcon={<BxsMagicWand />} onClick={onClick}>
      Create fields with AI
    </Button>
  )
}
