import { fireEvent, screen, waitFor } from '@testing-library/react'
import FileSaver from 'file-saver'

import { render } from '~/test-utils'

import {
  buildGoLinkQrCodeSvg,
  getGoLinkQrCodeFilename,
  rasteriseSvgToPngBlob,
} from '~features/link-shortener/qr/goLinkQrCode'

import { GoLinkQrCodeMenu } from './GoLinkQrCodeMenu'

const MOCK_SHORT_LINK = 'go.gov.sg/my-mock-form'

const mockToast = vi.fn()

const mockUseIsMobile = vi.fn()

vi.mock('file-saver')

vi.mock('~features/link-shortener/qr/goLinkQrCode', async () => {
  const actual = await vi.importActual<
    typeof import('~features/link-shortener/qr/goLinkQrCode')
  >('~features/link-shortener/qr/goLinkQrCode')
  return {
    ...actual,
    buildGoLinkQrCodeSvg: vi.fn(),
    rasteriseSvgToPngBlob: vi.fn(),
  }
})

vi.mock('~hooks/useToast', () => ({
  useToast: () => mockToast,
}))

vi.mock('~hooks/useIsMobile', () => ({
  useIsMobile: () => mockUseIsMobile(),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

describe('GoLinkQrCodeMenu', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUseIsMobile.mockReturnValue(false)
  })

  it('renders the trigger with its accessible name', () => {
    render(<GoLinkQrCodeMenu shortLink={MOCK_SHORT_LINK} />)

    expect(
      screen.getByRole('button', { name: 'goLink.qr.ariaLabel' }),
    ).toBeInTheDocument()
  })

  it('shows the visible label and default width on desktop', () => {
    mockUseIsMobile.mockReturnValue(false)
    render(<GoLinkQrCodeMenu shortLink={MOCK_SHORT_LINK} />)

    const trigger = screen.getByRole('button', { name: 'goLink.qr.ariaLabel' })
    expect(trigger).toHaveTextContent('goLink.qr.menuLabel')
    expect(trigger).not.toHaveStyle({ width: '100%' })
  })

  it('shows the visible label and stretches full-width on mobile', () => {
    mockUseIsMobile.mockReturnValue(true)
    render(<GoLinkQrCodeMenu shortLink={MOCK_SHORT_LINK} />)

    const trigger = screen.getByRole('button', { name: 'goLink.qr.ariaLabel' })
    expect(trigger).toHaveTextContent('goLink.qr.menuLabel')
    expect(trigger).toHaveStyle({ width: '100%' })
  })

  it('shows both format items when opened', () => {
    render(<GoLinkQrCodeMenu shortLink={MOCK_SHORT_LINK} />)

    fireEvent.click(screen.getByRole('button', { name: 'goLink.qr.ariaLabel' }))

    expect(screen.getByText('goLink.qr.downloadPng')).toBeInTheDocument()
    expect(screen.getByText('goLink.qr.downloadSvg')).toBeInTheDocument()
  })

  it('downloads the PNG when the PNG item is clicked', async () => {
    const mockSvg = { svg: '<svg></svg>', width: 1000, height: 1200 }
    vi.mocked(buildGoLinkQrCodeSvg).mockResolvedValueOnce(mockSvg)
    const mockPngBlob = new Blob(['png'], { type: 'image/png' })
    vi.mocked(rasteriseSvgToPngBlob).mockResolvedValueOnce(mockPngBlob)

    render(<GoLinkQrCodeMenu shortLink={MOCK_SHORT_LINK} />)

    fireEvent.click(screen.getByRole('button', { name: 'goLink.qr.ariaLabel' }))
    fireEvent.click(screen.getByText('goLink.qr.downloadPng'))

    await waitFor(() => expect(FileSaver.saveAs).toHaveBeenCalledTimes(1))

    expect(buildGoLinkQrCodeSvg).toHaveBeenCalledWith(MOCK_SHORT_LINK)
    expect(rasteriseSvgToPngBlob).toHaveBeenCalledWith(
      mockSvg.svg,
      mockSvg.width,
      mockSvg.height,
    )
    expect(FileSaver.saveAs).toHaveBeenCalledWith(
      mockPngBlob,
      getGoLinkQrCodeFilename(MOCK_SHORT_LINK, 'png'),
    )
    expect(mockToast).not.toHaveBeenCalled()
  })

  it('downloads the SVG when the SVG item is clicked', async () => {
    const mockSvg = { svg: '<svg>caption</svg>', width: 1000, height: 1098 }
    vi.mocked(buildGoLinkQrCodeSvg).mockResolvedValueOnce(mockSvg)

    render(<GoLinkQrCodeMenu shortLink={MOCK_SHORT_LINK} />)

    fireEvent.click(screen.getByRole('button', { name: 'goLink.qr.ariaLabel' }))
    fireEvent.click(screen.getByText('goLink.qr.downloadSvg'))

    await waitFor(() => expect(FileSaver.saveAs).toHaveBeenCalledTimes(1))

    // The SVG is saved as-is; only the PNG path goes through the rasteriser.
    expect(rasteriseSvgToPngBlob).not.toHaveBeenCalled()

    const [blob, filename] = vi.mocked(FileSaver.saveAs).mock.calls[0]
    expect(filename).toBe(getGoLinkQrCodeFilename(MOCK_SHORT_LINK, 'svg'))
    // jsdom's Blob has no text(), so the composed markup is checked by byte length.
    expect((blob as Blob).type).toBe('image/svg+xml;charset=utf-8')
    expect((blob as Blob).size).toBe(mockSvg.svg.length)
    expect(mockToast).not.toHaveBeenCalled()
  })

  it('does not start a second download while one is in flight', async () => {
    let resolveBuild: (value: {
      svg: string
      width: number
      height: number
    }) => void = () => undefined
    vi.mocked(buildGoLinkQrCodeSvg).mockReturnValueOnce(
      new Promise((resolve) => {
        resolveBuild = resolve
      }),
    )

    render(<GoLinkQrCodeMenu shortLink={MOCK_SHORT_LINK} />)

    fireEvent.click(screen.getByRole('button', { name: 'goLink.qr.ariaLabel' }))
    fireEvent.click(screen.getByText('goLink.qr.downloadSvg'))

    // The trigger reports the in-flight download, and a second attempt is ignored.
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'goLink.qr.ariaLabel' }),
      ).toHaveAttribute('data-loading'),
    )
    fireEvent.click(screen.getByRole('button', { name: 'goLink.qr.ariaLabel' }))

    resolveBuild({ svg: '<svg></svg>', width: 1000, height: 1098 })

    await waitFor(() => expect(FileSaver.saveAs).toHaveBeenCalledTimes(1))
    expect(buildGoLinkQrCodeSvg).toHaveBeenCalledTimes(1)
  })

  it('shows an error toast when building the QR code fails', async () => {
    vi.mocked(buildGoLinkQrCodeSvg).mockRejectedValueOnce(new Error('boom'))

    render(<GoLinkQrCodeMenu shortLink={MOCK_SHORT_LINK} />)

    fireEvent.click(screen.getByRole('button', { name: 'goLink.qr.ariaLabel' }))
    fireEvent.click(screen.getByText('goLink.qr.downloadPng'))

    await waitFor(() => expect(mockToast).toHaveBeenCalledTimes(1))

    expect(mockToast).toHaveBeenCalledWith(
      expect.objectContaining({ description: 'goLink.qr.downloadError' }),
    )
    expect(FileSaver.saveAs).not.toHaveBeenCalled()
  })
})
