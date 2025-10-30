import { useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { Box, Text, VisuallyHidden } from '@chakra-ui/react'
import { format } from 'date-fns'

import {
  FormColorTheme,
  FormDto,
  FormResponseMode,
  Language,
  PublicFormDto,
} from '~shared/types/form'

import { useMdComponents } from '~hooks/useMdComponents'
import { getValueInSelectedLanguage } from '~utils/multiLanguage'
import { MarkdownText } from '~components/MarkdownText'

import { SubmitAnotherResponseButton } from '~features/public-form/components/FormEndPage/SubmitAnotherResponseButton'
import { SubmissionData } from '~features/public-form/PublicFormContext'

import { StatusTrackerLink } from './StatusTrackerLink'

export interface EndPageBlockProps {
  formTitle: FormDto['title'] | undefined
  endPage: FormDto['endPage']
  submissionData: SubmissionData
  colorTheme?: FormColorTheme
  focusOnMount?: boolean
  isButtonHidden?: boolean
  form: PublicFormDto | undefined
  isPreview?: boolean
}

export const EndPageBlock = ({
  formTitle,
  endPage,
  submissionData,
  colorTheme = FormColorTheme.Blue,
  focusOnMount,
  isButtonHidden,
  form,
  isPreview,
}: EndPageBlockProps): JSX.Element => {
  const { i18n, t } = useTranslation('translation', {
    keyPrefix: 'components.formEndPage',
  })
  const focusRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (focusOnMount) {
      focusRef.current?.focus()
    }
  }, [focusOnMount])

  const mdComponents = useMdComponents({
    styles: {
      text: {
        textStyle: 'subhead-1',
        color: 'secondary.500',
      },
    },
  })

  const selectedLanguage = i18n.language as Language

  const title = getValueInSelectedLanguage({
    defaultValue: endPage.title,
    translations: endPage.titleTranslations,
    selectedLanguage,
  })

  const paragraph = getValueInSelectedLanguage({
    defaultValue: endPage.paragraph ?? '',
    translations: endPage.paragraphTranslations,
    selectedLanguage,
  })

  const submissionTimestamp = useMemo(
    () => format(new Date(submissionData.timestamp), 'dd MMM yyyy, HH:mm:ss z'),
    [submissionData.timestamp],
  )

  const submittedAriaText = useMemo(() => {
    if (formTitle) {
      return t('submittedAria.withTitle', { formTitle })
    }
    return t('submittedAria.withoutTitle')
  }, [formTitle, t])

  return (
    <>
      <Box ref={focusRef}>
        <VisuallyHidden aria-live="assertive">
          {submittedAriaText}
        </VisuallyHidden>
        <Text as="h2" textStyle="h2" textColor="secondary.500">
          {title}
        </Text>
        {paragraph ? (
          <Box mt="0.75rem">
            <MarkdownText components={mdComponents}>{paragraph}</MarkdownText>
          </Box>
        ) : null}
      </Box>
      <Box mt="1rem">
        <Box>
          <Text textColor="secondary.300" textStyle="caption-2">
            {t('responseId', { submissionId: submissionData.id })}
          </Text>
          <Text mt="0.25rem" textColor="secondary.300" textStyle="caption-2">
            {submissionTimestamp}
          </Text>
        </Box>

        {form?.responseMode == FormResponseMode.Multirespondent &&
        form?.hasStatusTracker ? (
          <Box mt="2rem">
            <StatusTrackerLink
              formId={form?._id}
              submissionId={submissionData.id}
              isPreview={isPreview}
            />
          </Box>
        ) : (
          <Box mt="2.25rem">
            {isButtonHidden || (
              <SubmitAnotherResponseButton
                endPage={endPage}
                colorTheme={colorTheme}
              />
            )}
          </Box>
        )}

        {/* For MRF status tracking preview */}
        {form?.responseMode == FormResponseMode.Multirespondent &&
        form?.hasStatusTracker &&
        isPreview ? (
          <Box mt="2.25rem">
            <SubmitAnotherResponseButton
              endPage={endPage}
              colorTheme={colorTheme}
            />
          </Box>
        ) : null}
      </Box>
    </>
  )
}
