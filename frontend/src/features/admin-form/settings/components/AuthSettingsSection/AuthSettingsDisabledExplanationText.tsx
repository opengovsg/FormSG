import { useTranslation } from 'react-i18next'
import { Box, List, ListItem } from '@chakra-ui/react'

import { FormResponseMode } from '~shared/types'

import InlineMessage from '~components/InlineMessage'

interface AuthSettingsDisabledExplanationTextProps {
  isFormPublic: boolean
  containsMyInfoFields: boolean
  formResponseMode?: string
}

const CONTAINS_MYINFO_FIELDS_DISABLED_EXPLANATION_TEXT =
  'To change any Singpass setting, close your form to new responses. For changes to your Singpass authentication mode, remove all existing Myinfo fields.'
const FORM_IS_PUBLIC_DISABLED_EXPLANATION_TEXT =
  'To change Singpass settings, close your form to new responses.'
const FORM_HAS_MYINFO_FIELDS =
  'For changes to your Singpass authentication mode, remove all existing Myinfo fields.'

export const AuthSettingsDisabledExplanationText = ({
  isFormPublic,
  containsMyInfoFields,
  formResponseMode,
}: AuthSettingsDisabledExplanationTextProps) => {
  const { t } = useTranslation()

  const infoboxTextArray: string[] = []
  if (formResponseMode === FormResponseMode.Multirespondent) {
    infoboxTextArray.push(
      t('features.adminForm.settings.general.singpass.mrfFirstStep'),
    )
  }

  if (isFormPublic) {
    infoboxTextArray.push(FORM_IS_PUBLIC_DISABLED_EXPLANATION_TEXT)
  }

  if (containsMyInfoFields) {
    infoboxTextArray.push(FORM_HAS_MYINFO_FIELDS)
  }

  const infoboxTextComponent = infoboxTextArray.length ? (
    infoboxTextArray.length > 2 ? (
      <InlineMessage mb="1rem">
        <List styleType="disc" pl="1.5rem" m={0}>
          {infoboxTextArray.map((text, i) => (
            <ListItem key={i}>{text}</ListItem>
          ))}
        </List>
      </InlineMessage>
    ) : (
      <InlineMessage mb="1rem">{infoboxTextArray.join(' ')}</InlineMessage>
    )
  ) : null

  return <Box my="2.5rem">{infoboxTextComponent}</Box>
}
