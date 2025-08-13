import { BiLinkExternal } from 'react-icons/bi'
import {
  Box,
  FormControl,
  InputGroup,
  InputRightElement,
  Skeleton,
  Stack,
} from '@chakra-ui/react'

import { STATUS_TRACKER_PREVIEW_LINK } from '~shared/constants'
import { getStatusTrackerPath } from '~shared/utils/urls'

import FormLabel from '~components/FormControl/FormLabel'
import IconButton from '~components/IconButton'
import Input from '~components/Input'
import { CopyButton } from '~templates/CopyButton'

type StatusTrackerLinkProps = {
  formId: string
  submissionId: string | undefined
  isPreview?: boolean
}

export const StatusTrackerLink = ({
  formId,
  submissionId,
  isPreview,
}: StatusTrackerLinkProps): JSX.Element => {
  const statusTrackerLink = isPreview
    ? STATUS_TRACKER_PREVIEW_LINK
    : `${window.location.origin}/${getStatusTrackerPath(formId, submissionId)}`

  return (
    <FormControl isReadOnly>
      <Box>
        <FormLabel
          isRequired
          description={'Track the status of your response through this link'}
        >
          Status tracking link
        </FormLabel>
      </Box>
      <Skeleton isLoaded={!!formId}>
        <Stack direction="row" align="center">
          <InputGroup>
            <Input
              // The link will always change in Chromatic so this should be ignored.
              data-chromatic="ignore"
              isReadOnly
              value={statusTrackerLink}
              hasInputRightElement={Boolean(formId)}
            />
            {formId ? (
              <InputRightElement>
                <CopyButton
                  colorScheme="secondary"
                  stringToCopy={statusTrackerLink}
                  aria-label="Copy respondent form link"
                />
              </InputRightElement>
            ) : null}
          </InputGroup>
          <IconButton
            as="a"
            icon={<BiLinkExternal fontSize="1.5rem" />}
            href={statusTrackerLink}
            target="_blank"
            rel="noopener"
            aria-label="Open link in new tab"
          />
        </Stack>
      </Skeleton>
    </FormControl>
  )
}
