import { useState } from 'react'
import { BiLockAlt, BiMailSend } from 'react-icons/bi'
import { Stack, UnorderedList } from '@chakra-ui/react'
import { Meta, StoryFn } from '@storybook/react'
import { values } from 'lodash'

import Badge from '~components/Badge'

import { Tile, TileProps } from './Tile'

export default {
  title: 'Components/Tiles',
  component: Tile,
  decorators: [],
} as Meta

const List = ({
  listTitle,
  listItems = [],
}: {
  listTitle: string
  listItems: string[]
}) => (
  <>
    <Tile.Text textStyle="subhead-2">{listTitle}</Tile.Text>
    <UnorderedList>
      {listItems.map((text, i) => (
        <Tile.ListItem textStyle="body-2" textAlign="left" key={i}>
          {text}
        </Tile.ListItem>
      ))}
    </UnorderedList>
  </>
)

interface TileTemplateProps extends TileProps {
  title: string
  subtitle: string
  listTitle: string
  listItems: Record<string, string>
}

const Template: StoryFn<TileTemplateProps> = ({
  title,
  subtitle,
  listTitle,
  listItems,
  ...args
}) => {
  const [isClicked, setIsClicked] = useState<boolean>(false)
  const hasDescription = listTitle || listItems
  return (
    <Tile
      {...args}
      onClick={() => setIsClicked(!isClicked)}
      isActive={isClicked}
    >
      <Tile.Title>{title}</Tile.Title>
      <Tile.Subtitle>{subtitle}</Tile.Subtitle>
      {hasDescription && (
        <List listTitle={listTitle} listItems={values(listItems)} />
      )}
    </Tile>
  )
}

export const Complex = Template.bind({})
Complex.args = {
  variant: 'complex',
  title: 'Complex',
  subtitle: 'Receive responses in forms',
  badge: <Badge colorScheme="success">recommended</Badge>,
  icon: BiLockAlt,
  listTitle: 'description',
  listItems: {
    1: 'item 1',
    2: 'item 2',
  },
}

export const Simple = Template.bind({})
Simple.args = {
  variant: 'simple',
  title: 'Simple',
  subtitle: 'Receive responses in forms',
  icon: BiMailSend,
}

export const Playground: StoryFn = () => {
  const [selected, setSelected] = useState('')

  return (
    <Stack
      width={{ md: '100%' }}
      direction={{ base: 'column', md: 'row' }}
      spacing="1rem"
    >
      <StorageTile
        onClick={() => setSelected('storage')}
        isActive={selected === 'storage'}
      />
      <EmailTile
        onClick={() => setSelected('email')}
        isActive={selected === 'email'}
      />
    </Stack>
  )
}

interface StoryTileProps {
  onClick: () => void
  isActive?: boolean
}

const EmailTile = ({ onClick, isActive }: StoryTileProps) => (
  <Tile
    variant="complex"
    icon={BiMailSend}
    isActive={isActive}
    onClick={onClick}
    flex={1}
  >
    <Tile.Title>Email Mode</Tile.Title>
    <Tile.Subtitle>Receive responses in your inbox</Tile.Subtitle>
    <List
      listTitle="Who is it for:"
      listItems={['Emailed copy of response', 'MyInfo fields']}
    />
  </Tile>
)

const StorageTile = ({ onClick, isActive }: StoryTileProps) => (
  <Tile
    variant="complex"
    icon={BiLockAlt}
    badge={<Badge colorScheme="success">recommended</Badge>}
    isActive={isActive}
    onClick={onClick}
    flex={1}
  >
    <Tile.Title>Storage Mode</Tile.Title>
    <Tile.Subtitle>Receive responses in Form</Tile.Subtitle>
    <List
      listTitle="Who is it for:"
      listItems={['High-volume forms', 'End to end encryption needs']}
    />
  </Tile>
)
