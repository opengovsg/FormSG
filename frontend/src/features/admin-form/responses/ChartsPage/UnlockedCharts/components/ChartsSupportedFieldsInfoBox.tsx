import React from 'react'
import { useTranslation } from 'react-i18next'
import {
  BiAlignLeft,
  BiCaretDownSquare,
  BiFlag,
  BiRadioCircleMarked,
  BiRename,
  BiSelectMultiple,
  BiStar,
  BiToggleLeft,
} from 'react-icons/bi'
import { As, Box, Flex, Grid, GridItem, Icon, Text } from '@chakra-ui/react'

const ListWithIcon = ({
  children,
  icon,
}: {
  children: React.ReactNode
  icon: As
}) => (
  <GridItem>
    <Flex align="center">
      <Icon as={icon} mr="0.5rem" />
      <Text>{children}</Text>
    </Flex>
  </GridItem>
)

export function ChartsSupportedFieldsInfoBox() {
  const { t } = useTranslation()

  return (
    <Box pt="1.5rem">
      <Text
        textStyle="subhead-3"
        color="secondary.500"
        textTransform="uppercase"
      >
        {t(
          'features.adminForm.responses.charts.components.supportedFieldsInfoBox.supportedFields',
        )}
      </Text>
      <Grid templateColumns="repeat(3,1fr)" mt="1.5rem" gap="1rem 2rem">
        <ListWithIcon icon={BiRename}>
          {t(
            'features.adminForm.responses.charts.components.supportedFieldsInfoBox.shortAnswer',
          )}
        </ListWithIcon>
        <ListWithIcon icon={BiAlignLeft}>
          {t(
            'features.adminForm.responses.charts.components.supportedFieldsInfoBox.longAnswer',
          )}
        </ListWithIcon>
        <ListWithIcon icon={BiRadioCircleMarked}>
          {t(
            'features.adminForm.responses.charts.components.supportedFieldsInfoBox.radio',
          )}
        </ListWithIcon>
        <ListWithIcon icon={BiSelectMultiple}>
          {t(
            'features.adminForm.responses.charts.components.supportedFieldsInfoBox.checkbox',
          )}
        </ListWithIcon>
        <ListWithIcon icon={BiCaretDownSquare}>
          {t(
            'features.adminForm.responses.charts.components.supportedFieldsInfoBox.dropdown',
          )}
        </ListWithIcon>
        <ListWithIcon icon={BiFlag}>
          {t(
            'features.adminForm.responses.charts.components.supportedFieldsInfoBox.countryRegion',
          )}
        </ListWithIcon>
        <ListWithIcon icon={BiToggleLeft}>
          {t(
            'features.adminForm.responses.charts.components.supportedFieldsInfoBox.yesOrNo',
          )}
        </ListWithIcon>
        <ListWithIcon icon={BiStar}>
          {t(
            'features.adminForm.responses.charts.components.supportedFieldsInfoBox.rating',
          )}
        </ListWithIcon>
      </Grid>
    </Box>
  )
}
