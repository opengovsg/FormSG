import { Text } from '@chakra-ui/react'

/** The rules that lose their references when login fields are deleted. */
export const AffectedAuthFieldRules = ({
  rules,
}: {
  rules: readonly string[]
}): JSX.Element | null =>
  rules.length ? (
    <>
      <Text>References to these fields will also be removed from:</Text>
      {rules.map((rule) => (
        <Text key={rule}>{rule}</Text>
      ))}
    </>
  ) : null
