import { Box, ButtonGroup, MenuButton } from '@chakra-ui/react'

import { BxsChevronDown } from '~assets/icons/BxsChevronDown'
import { BxsChevronUp } from '~assets/icons/BxsChevronUp'
import Badge from '~components/Badge'
import Button from '~components/Button'
import IconButton from '~components/IconButton'
import Menu from '~components/Menu'

export const DownloadButton = (): JSX.Element => {
  return (
    <Box gridArea="export" justifySelf="flex-end">
      <Menu placement="bottom-end">
        {({ isOpen }) => (
          <>
            <ButtonGroup isAttached display="flex">
              <Button px="1.5rem" mr="2px">
                Download
              </Button>
              <MenuButton
                as={IconButton}
                // isDisabled={isDisabled}
                isActive={isOpen}
                aria-label="More download options"
                icon={isOpen ? <BxsChevronUp /> : <BxsChevronDown />}
              />
            </ButtonGroup>
            <Menu.List>
              <Menu.Item>CSV only</Menu.Item>
              <Menu.Item>
                CSV with attachments
                <Badge ml="0.5rem" colorScheme="success">
                  beta
                </Badge>
              </Menu.Item>
            </Menu.List>
          </>
        )}
      </Menu>
    </Box>
  )
}
