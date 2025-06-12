import { BiLinkExternal } from 'react-icons/bi'
import {
  FormControl,
  FormLabel,
  InputGroup,
  InputRightElement,
  Skeleton,
  Stack,
} from '@chakra-ui/react'

import IconButton from '~components/IconButton'
import Input from '~components/Input'
import { CopyButton } from '~templates/CopyButton'

type StatusTrackerLinkProps = {
  formId: string | undefined
  submissionId: string | undefined
}

export const StatusTrackerLink = ({
  formId,
  submissionId,
}: StatusTrackerLinkProps): JSX.Element => {
  const shareLink = `${window.location.origin}/${formId}/status/${submissionId}`
  console.log('null')
  return (
    <FormControl isReadOnly>
      <FormLabel>Form link</FormLabel>
      <Skeleton isLoaded={!!formId}>
        <Stack direction="row" align="center">
          <InputGroup>
            <Input
              // The link will always change in Chromatic so this should be ignored.
              data-chromatic="ignore"
              isReadOnly
              value={shareLink}
              hasInputRightElement={Boolean(formId)}
            />
            {formId ? (
              <InputRightElement>
                <CopyButton
                  colorScheme="secondary"
                  stringToCopy={shareLink}
                  aria-label="Copy respondent form link"
                />
              </InputRightElement>
            ) : null}
          </InputGroup>
          <IconButton
            as="a"
            icon={<BiLinkExternal fontSize="1.5rem" />}
            href={shareLink}
            target="_blank"
            rel="noopener"
            aria-label="Open link in new tab"
          />
        </Stack>
      </Skeleton>
    </FormControl>
  )
}
