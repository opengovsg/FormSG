import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { BiChevronLeft, BiChevronRight, BiLeftArrowAlt } from 'react-icons/bi'
import { FaRegFilePdf } from 'react-icons/fa6'
import {
  Link as ReactLink,
  useLocation,
  useNavigate,
  useParams,
} from 'react-router-dom'
import { useReactToPrint } from 'react-to-print'
import {
  Box,
  ButtonGroup,
  Flex,
  Grid,
  Icon,
  Link,
  Skeleton,
  Stack,
  Text,
} from '@chakra-ui/react'
import { datadogLogs } from '@datadog/browser-logs'
import { useFeatureIsOn, useGrowthBook } from '@growthbook/growthbook-react'

import { featureFlags } from '~shared/constants'

import { noPrintCss } from '~utils/noPrintCss'
import IconButton from '~components/IconButton'

import { useAdminForm } from '~features/admin-form/common/queries'
import { useUser } from '~features/user/queries'

import { useUnlockedResponses } from '../ResponsesPage/storage/UnlockedResponses/UnlockedResponsesProvider'

import PrintableResponse from './PrintableResponse'
import { useIndividualSubmission } from './queries'

export const IndividualResponseNavbar = (): JSX.Element => {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { submissionId } = useParams()
  if (!submissionId) throw new Error('Missing submissionId')

  const currentResponseNumber = useMemo(() => {
    return (state as { responseNumber?: number })?.responseNumber
  }, [state])

  const {
    lastNavPage,
    lastNavSubmissionId,
    getNextSubmissionId,
    getPreviousSubmissionId,
    onNavNextSubmissionId,
    onNavPreviousSubmissionId,
    isAnyFetching,
  } = useUnlockedResponses()
  const { data: form, isLoading: isFormLoading } = useAdminForm()
  const { isLoading } = useIndividualSubmission()

  const nextSubmissionId = useMemo(
    () => getNextSubmissionId(submissionId),
    [getNextSubmissionId, submissionId],
  )
  const prevSubmissionId = useMemo(
    () => getPreviousSubmissionId(submissionId),
    [getPreviousSubmissionId, submissionId],
  )

  const handleNavigateNext = useCallback(() => {
    if (!nextSubmissionId) return
    navigate(`../${nextSubmissionId}`, {
      state: {
        responseNumber: currentResponseNumber
          ? currentResponseNumber - 1
          : undefined,
      },
    })
    onNavNextSubmissionId(submissionId)
  }, [
    currentResponseNumber,
    navigate,
    nextSubmissionId,
    onNavNextSubmissionId,
    submissionId,
  ])

  const handleNavigatePrev = useCallback(() => {
    if (!prevSubmissionId) return
    navigate(`../${prevSubmissionId}`, {
      state: {
        responseNumber: currentResponseNumber
          ? currentResponseNumber + 1
          : undefined,
      },
    })
    onNavPreviousSubmissionId(submissionId)
  }, [
    currentResponseNumber,
    navigate,
    onNavPreviousSubmissionId,
    prevSubmissionId,
    submissionId,
  ])

  const backLink = useMemo(() => {
    if (!lastNavPage && !lastNavSubmissionId) return `..`
    const searchParams = new URLSearchParams()
    if (lastNavPage) searchParams.set('page', lastNavPage.toString())
    if (lastNavSubmissionId) {
      searchParams.set('submissionId', lastNavSubmissionId)
    }
    return `..?${searchParams}`
  }, [lastNavPage, lastNavSubmissionId])

  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.responses.individualResponse',
  })

  const { user } = useUser()
  const gb = useGrowthBook()

  useEffect(() => {
    if (user && gb) {
      gb.setAttributes({
        adminEmail: user.email,
        adminAgency: user.agency,
        ...gb.getAttributes(),
      })
    }
  }, [gb, user])

  const isAdminPrintPdfEnabled = useFeatureIsOn(featureFlags.adminPrintPdf)

  const printableResponseRef = useRef<HTMLDivElement>(null)
  const reactToPrintFn = useReactToPrint({
    contentRef: printableResponseRef,
    documentTitle: `${form ? `${form.title}_formId_${form._id}_` : ''}submissionId_${submissionId}_response.pdf`,
  })

  return (
    <Grid
      sx={noPrintCss}
      position="sticky"
      top={0}
      bg="white"
      zIndex="docked"
      templateAreas={{
        base: "'back navigate' 'respondent respondent'",
        md: "'back respondent navigate'",
      }}
      templateColumns={{ base: '1fr auto', md: 'auto 1fr auto' }}
      rowGap={{ base: '1.5rem', md: '2.5rem' }}
      py={{ base: '1.5rem', md: '3rem' }}
    >
      <Flex gridArea="back" align="center">
        <Link
          display="inline-flex"
          as={ReactLink}
          variant="standalone"
          to={backLink}
        >
          <Icon as={BiLeftArrowAlt} fontSize="1.5rem" mr="0.5rem" />
          {t('backToList')}
        </Link>
      </Flex>
      <Flex gridArea="respondent" justify="center" align="center">
        <Skeleton isLoaded={!isLoading}>
          <Stack direction="row" justify="center" align="center">
            <Text textStyle="h2" as="h2">
              {t('features.common.response', { ns: 'translation', keyPrefix: '' })}
              {currentResponseNumber ? ` #${currentResponseNumber}` : ''}
            </Text>
            {isAdminPrintPdfEnabled && (
              <Box>
                <IconButton
                  aria-label={t('individualResponseNavbar.printAriaLabel')}
                  icon={<FaRegFilePdf />}
                  isLoading={isLoading || isFormLoading}
                  onClick={() => {
                    datadogLogs.logger.info(
                      `IndividualResponseNavbar: admin printing pdf`,
                      {
                        meta: {
                          action: 'adminPrintPdf',
                          userId: user?._id,
                          submissionId: submissionId,
                        },
                      },
                    )
                    reactToPrintFn()
                  }}
                  variant="clear"
                />
                <PrintableResponse ref={printableResponseRef} />
              </Box>
            )}
          </Stack>
        </Skeleton>
      </Flex>
      <ButtonGroup gridArea="navigate">
        <IconButton
          isDisabled={!prevSubmissionId || isAnyFetching}
          onClick={handleNavigatePrev}
          icon={<BiChevronLeft />}
          aria-label={t('previousSubmission')}
        />
        <IconButton
          isDisabled={!nextSubmissionId || isAnyFetching}
          onClick={handleNavigateNext}
          icon={<BiChevronRight />}
          aria-label={t('nextSubmission')}
        />
      </ButtonGroup>
    </Grid>
  )
}
