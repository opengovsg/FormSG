import React from 'react'
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

export const ChartsSupportedFieldsInfoBox = () => (
  <Box pt="1.5rem">
    <Text textStyle="subhead-3" color="secondary.500" textTransform="uppercase">
      Supported fields
    </Text>
    <Grid templateColumns="repeat(3,1fr)" mt="1.5rem" gap="1rem 2rem">
      <ListWithIcon icon={BiRename}>Short answer</ListWithIcon>
      <ListWithIcon icon={BiAlignLeft}>Long answer</ListWithIcon>
      <ListWithIcon icon={BiRadioCircleMarked}>Radio</ListWithIcon>
      <ListWithIcon icon={BiSelectMultiple}>Checkbox</ListWithIcon>
      <ListWithIcon icon={BiCaretDownSquare}>Dropdown</ListWithIcon>
      <ListWithIcon icon={BiFlag}>Country Region</ListWithIcon>
      <ListWithIcon icon={BiToggleLeft}>Yes / No</ListWithIcon>
      <ListWithIcon icon={BiStar}>Rating</ListWithIcon>
    </Grid>
  </Box>
)
