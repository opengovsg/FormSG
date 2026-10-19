import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { BiChevronRight, BiX } from 'react-icons/bi'
import { useDebounce } from 'react-use'
import {
  Flex,
  Icon,
  InputGroup,
  InputRightElement,
  Popover,
  PopoverBody,
  PopoverContent,
  PopoverTrigger,
  Portal,
  Text,
} from '@chakra-ui/react'

import Badge from '~components/Badge'
import IconButton from '~components/IconButton'
import Input from '~components/Input'

const FILTER_DEBOUNCE_MS = 200

interface ColumnFilterRowProps {
  label: string
  text: string
  isOpen: boolean
  onOpen: () => void
  onClose: () => void
  onFilter: (text: string) => void
}

/**
 * A column in the Filter menu: clicking it opens a field beside it whose text
 * filters the table to rows whose value in that column contains it.
 */
export const ColumnFilterRow = ({
  label,
  text,
  isOpen,
  onOpen,
  onClose,
  onFilter,
}: ColumnFilterRowProps): JSX.Element => {
  const { t } = useTranslation()
  const { filterApplied, filterPlaceholder, clearFilter } = t(
    'features.adminForm.responses.responsesPage.storage.unlockedResponses.filterMenu',
    { returnObjects: true },
  )
  const [draft, setDraft] = useState(text)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => setDraft(text), [text])

  useDebounce(
    () => {
      if (draft !== text) onFilter(draft)
    },
    FILTER_DEBOUNCE_MS,
    [draft],
  )

  const handleClear = () => {
    setDraft('')
    onFilter('')
    inputRef.current?.focus()
  }

  // Closing applies the text at once, so a filter typed just before clicking
  // away is not lost to the debounce.
  const handleClose = () => {
    if (draft !== text) onFilter(draft)
    onClose()
  }

  return (
    <Popover
      isOpen={isOpen}
      onOpen={onOpen}
      onClose={handleClose}
      placement="right-start"
      isLazy
    >
      <PopoverTrigger>
        <Flex
          as="button"
          type="button"
          align="center"
          gap="0.5rem"
          w="100%"
          px="1rem"
          py="0.625rem"
          textAlign="left"
          bg={isOpen ? 'primary.100' : undefined}
          _hover={{ bg: 'primary.100' }}
          aria-expanded={isOpen}
        >
          <Text
            flex={1}
            minW={0}
            noOfLines={1}
            textStyle="body-1"
            title={label}
          >
            {label}
          </Text>
          {text ? (
            <Badge variant="subtle" colorScheme="primary" flexShrink={0}>
              {filterApplied}
            </Badge>
          ) : null}
          <Icon as={BiChevronRight} fontSize="1.25rem" flexShrink={0} />
        </Flex>
      </PopoverTrigger>
      <Portal>
        <PopoverContent w="16rem" bg="white">
          <PopoverBody p="0.75rem">
            <InputGroup>
              <Input
                ref={inputRef}
                autoFocus
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                // RATIONALE: the popover is portalled but React still bubbles its
                // key presses to the Filter menu, whose typeahead would take
                // focus from the field, and whose Escape would close the menu.
                onKeyDown={(event) => {
                  event.stopPropagation()
                  if (event.key === 'Enter' || event.key === 'Escape') {
                    handleClose()
                  }
                }}
                placeholder={filterPlaceholder}
                aria-label={label}
              />
              {draft ? (
                <InputRightElement>
                  <IconButton
                    aria-label={clearFilter}
                    size="sm"
                    variant="clear"
                    colorScheme="secondary"
                    color="secondary.300"
                    icon={<BiX fontSize="1.25rem" />}
                    onClick={handleClear}
                  />
                </InputRightElement>
              ) : null}
            </InputGroup>
          </PopoverBody>
        </PopoverContent>
      </Portal>
    </Popover>
  )
}
