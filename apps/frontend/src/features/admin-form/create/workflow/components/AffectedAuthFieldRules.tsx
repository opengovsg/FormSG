import { useTranslation } from 'react-i18next'
import { Text } from '@chakra-ui/react'

/** The rules that lose their references when login fields are deleted. */
export const AffectedAuthFieldRules = ({
  rules,
}: {
  rules: readonly string[]
}): JSX.Element | null => {
  const { t } = useTranslation()
  return rules.length ? (
    <>
      <Text>
        {t(
          'features.adminForm.sidebar.workflow.stepLogin.switchConfirmation.affectedRules',
        )}
      </Text>
      {rules.map((rule) => (
        <Text key={rule}>{rule}</Text>
      ))}
    </>
  ) : null
}
