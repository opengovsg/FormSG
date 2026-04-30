import { useTranslation } from 'react-i18next'
import { BiBulb } from 'react-icons/bi'
import { Box, BoxProps, CloseButton, Flex, Icon, Text } from '@chakra-ui/react'

import Badge from '~components/Badge'
import Button, { ButtonProps } from '~components/Button'

import { FeatureTourStep } from '~features/admin-form/create/featureTour/FeatureTourTooltip'

export interface UseTemplateTourTooltipProps {
  step: FeatureTourStep
  tooltipProps: BoxProps
  primaryProps: ButtonProps
  closeProps: ButtonProps
}

export const UseTemplateTourTooltip = ({
  step,
  tooltipProps,
  primaryProps,
  closeProps,
}: UseTemplateTourTooltipProps): JSX.Element => {
  const { t } = useTranslation('translation', {
    keyPrefix: 'features.adminForm.template.useTemplateTour',
  })
  return (
    <Box
      padding="1.5rem"
      alignItems="center"
      maxW="100%"
      w="18rem"
      color="secondary.500"
      bg="primary.100"
      borderRadius="4px"
      {...tooltipProps}
      position="relative"
    >
      <CloseButton
        variant="clear"
        colorScheme="neutral"
        position="absolute"
        right="1.25rem"
        top="1.25rem"
        {...closeProps}
      />
      <Badge
        colorScheme="success"
        variant="solid"
        display="flex"
        width="fit-content"
      >
        <Icon as={BiBulb} mr="0.25rem" fontSize="1rem" />
        <Text textStyle="caption-1">{t('tooltip.badge')}</Text>
      </Badge>
      <Text textStyle="subhead-1" color="secondary.500" marginTop="1.25rem">
        {step.title}
      </Text>
      <Text textStyle="body-2" color="secondary.500" marginTop="0.5rem">
        {step.content}
      </Text>
      <Flex flexDirection="row" marginTop="2rem" justifyContent="flex-end">
        <Button {...primaryProps} title={t('tooltip.done')}>
          {t('tooltip.done')}
        </Button>
      </Flex>
    </Box>
  )
}
