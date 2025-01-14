import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Box,
  FormLabel as ChakraFormLabel,
  FormLabelProps as ChakraFormLabelProps,
  Icon,
  Text,
  TextProps,
  useFormControlContext,
} from '@chakra-ui/react'

import { BxsHelpCircle } from '~assets/icons/BxsHelpCircle'
import { BxsInfoCircle } from '~assets/icons/BxsInfoCircle'
import { useMdComponents } from '~hooks/useMdComponents'
import { MarkdownText } from '~components/MarkdownText'
import Tooltip from '~components/Tooltip'
import { TooltipProps } from '~components/Tooltip/Tooltip'

export interface FormLabelProps extends ChakraFormLabelProps {
  /**
   * Question number to be prefixed before each label, if any.
   */
  questionNumber?: string
  /**
   * Tooltip text to be postfixed at the end of each label, if any.
   */
  tooltipText?: string
  /**
   * Tooltip placement for the tooltip text, if any.
   */
  tooltipPlacement?: TooltipProps['placement']
  /**
   * Determines Tooltip icon used for the tooltip text. Defaults to help.
   */
  tooltipVariant?: 'info' | 'help'
  /**
   * Description text to be shown below the label text, if any.
   */
  description?: string
  /**
   * Label text.
   */
  children: string
  /**
   * Whether form label is required. This is optional; if this prop is not
   * provided, the value from it's parent `FormContext` (if any) will be used.
   */
  isRequired?: boolean

  /**
   * Whether markdown is enabled for description text.
   */
  useMarkdownForDescription?: boolean
}

/**
 * @preconditions Must be a child of Chakra's `FormControl` component.
 * Used to enhance the usability of form controls.
 *
 * It is used to inform users as to what information
 * is requested for a form field.
 *
 * ♿️ Accessibility: Every form field should have a form label.
 */
export const FormLabel = ({
  isRequired,
  tooltipText,
  tooltipPlacement,
  tooltipVariant,
  questionNumber,
  description,
  useMarkdownForDescription = false,
  children,
  ...labelProps
}: FormLabelProps): JSX.Element => {
  return (
    <FormLabel.Label
      requiredIndicator={<Box />}
      display="flex"
      flexDir="column"
      overflowWrap="break-word"
      {...labelProps}
    >
      <Box overflowWrap="anywhere">
        {questionNumber && (
          <FormLabel.QuestionNumber>{questionNumber}</FormLabel.QuestionNumber>
        )}
        {children}
        <FormLabel.OptionalIndicator isRequired={isRequired} />
        {tooltipText && (
          <Tooltip
            placement={tooltipPlacement}
            label={tooltipText}
            aria-label={`Tooltip content: ${tooltipText}`}
          >
            <Icon
              ml="0.5rem"
              mb="0.1rem"
              color="secondary.500"
              as={tooltipVariant === 'info' ? BxsInfoCircle : BxsHelpCircle}
              verticalAlign="middle"
            />
          </Tooltip>
        )}
      </Box>
      {description && (
        <FormLabel.Description
          useMarkdown={useMarkdownForDescription}
          whiteSpace="pre-wrap"
          overflowWrap="anywhere"
        >
          {description}
        </FormLabel.Description>
      )}
    </FormLabel.Label>
  )
}

FormLabel.Label = ChakraFormLabel

interface FormLabelDescriptionProps extends TextProps {
  useMarkdown?: boolean
  children: string
}
const FormLabelDescription = ({
  children,
  useMarkdown = false,
  ...props
}: FormLabelDescriptionProps): JSX.Element => {
  // useFormControlContext is a ChakraUI hook that returns props passed down
  // from a parent ChakraUI's `FormControl` component.
  // The return object is used to determine whether FormHelperText or Text is
  // used.
  // Using FormHelperText allows for the children text to be added to the parent
  // FormLabel's aria-describedby attribute. This is done internally by ChakraUI.
  const field = useFormControlContext()

  const styleProps = useMemo(
    () => ({
      textStyle: 'body-2',
      color: 'secondary.400',
      mt: 0,
      ...props,
    }),
    [props],
  )

  const fieldProps = useMemo(
    () => field?.getHelpTextProps(props),
    [field, props],
  )

  const mdComponentsStyles = {
    text: styleProps,
    link: { display: 'initial' },
  }
  const mdComponents = useMdComponents({
    styles: mdComponentsStyles,
    overrides: {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      p: ({ node: _, ...mdProps }) => (
        <Text {...fieldProps} {...mdProps} sx={mdComponentsStyles.text} />
      ),
    },
  })

  return useMarkdown ? (
    <MarkdownText multilineBreaks components={mdComponents}>
      {children}
    </MarkdownText>
  ) : (
    <Text {...fieldProps} {...styleProps}>
      {children}
    </Text>
  )
}

FormLabel.Description = FormLabelDescription

FormLabel.QuestionNumber = ({ children, ...props }: TextProps): JSX.Element => {
  return (
    <Text
      as="span"
      textStyle="caption-1"
      color="secondary.700"
      mr="0.5rem"
      verticalAlign="baseline"
      lineHeight={0}
      {...props}
    >
      {children}
    </Text>
  )
}

FormLabel.OptionalIndicator = ({
  isRequired,
  ...props
}: TextProps & { isRequired?: boolean }): JSX.Element | null => {
  // useFormControlContext is a ChakraUI hook that returns props passed down
  // from a parent ChakraUI's `FormControl` component.
  // Valid hook usage since composited component is still a component.
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const field = useFormControlContext()
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const { t } = useTranslation()

  // If isRequired is explicitly provided, ignore form control context value.
  if (isRequired ?? field?.isRequired) return null

  return (
    <Text
      as="span"
      role="presentation"
      textStyle="body-2"
      ml="0.5rem"
      color="neutral.700"
      lineHeight={0}
      {...props}
    >
      {`(${t('features.common.optional')})`}
    </Text>
  )
}
