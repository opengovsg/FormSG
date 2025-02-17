import { BiSolidMagicWand } from 'react-icons/bi'

import Button from '~components/Button'

export const MagicFormButton = ({
  onClick,
}: {
  onClick: () => void
}): JSX.Element => {
  return (
    <>
      <Button
        maxW="100%"
        rightIcon={<BiSolidMagicWand fontSize="1.5rem" />}
        onClick={onClick}
      >
        Create fields with AI
      </Button>
    </>
  )
}
