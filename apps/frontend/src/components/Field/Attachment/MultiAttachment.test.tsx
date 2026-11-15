import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { downloadZip } from 'client-zip'
import { describe, expect, it, vi } from 'vitest'

import { MultiAttachment } from './MultiAttachment'

const MB = 1024 * 1024

const attach = async (files: File[]) => {
  const onChange = vi.fn()
  const onError = vi.fn()
  render(
    <MultiAttachment
      name="field"
      value={[]}
      maxTotalSize={MB}
      maxFiles={20}
      onChange={onChange}
      onError={onError}
    />,
  )
  await userEvent.upload(screen.getByTestId('field'), files)
  await waitFor(() =>
    expect(onChange.mock.calls.length + onError.mock.calls.length).toBe(1),
  )
  return { onChange, onError }
}

describe('MultiAttachment', () => {
  it('rejects files whose zip is one byte over the size limit', async () => {
    const sizes = { 'a.pdf': MB / 2, 'b.pdf': MB / 2 }
    // jsdom's File can't be read, so the zip is built from the same bytes
    const zipLength = async () =>
      (
        await downloadZip(
          Object.entries(sizes).map(([name, size]) => ({
            name,
            input: new Uint8Array(size),
          })),
        ).arrayBuffer()
      ).byteLength
    sizes['b.pdf'] -= (await zipLength()) - MB - 1
    expect(await zipLength()).toBe(MB + 1)

    const { onChange, onError } = await attach(
      Object.entries(sizes).map(
        ([name, size]) =>
          new File([new Uint8Array(size)], name, { type: 'application/pdf' }),
      ),
    )

    expect(onChange).not.toHaveBeenCalled()
    expect(onError).toHaveBeenCalledWith(
      expect.stringContaining('exceeded the file size limit'),
    )
  })
})
