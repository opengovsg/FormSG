import { useRef, useState } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Decorator } from '@storybook/react-vite'

import logoUrl from './formsg-logo.png'

// The templates link their logo on a public CDN. Screenshots must not depend
// on it loading, so point it at a copy bundled with Storybook.
const REMOTE_LOGO_URL = 'https://file.go.gov.sg/formslogotransparent120px.png'

// Email templates render a full <html> document, and email clients show each
// one on its own. Rendering it inside the story root nests a second <body>,
// which makes screenshots ambiguous, and flattening it into the page drops the
// <body> styles (font, background). A real document in an iframe keeps both.
const EmailDocument = ({ html }: { html: string }) => {
  const frame = useRef<HTMLIFrameElement>(null)
  const [height, setHeight] = useState<number>()
  return (
    // Argos waits for aria-busy to clear, so the screenshot is not taken
    // before the iframe's document and images have loaded and been measured.
    <div aria-busy={height === undefined}>
      <iframe
        ref={frame}
        title="Email"
        srcDoc={`<!doctype html>${html.replaceAll(
          REMOTE_LOGO_URL,
          new URL(logoUrl, window.location.href).href,
        )}`}
        // Viewport width, content height: Argos fits the screenshot to this
        // box, so it needs a real width and the height the email renders at.
        onLoad={() =>
          setHeight(
            frame.current?.contentDocument?.documentElement.scrollHeight,
          )
        }
        style={{ display: 'block', border: 0, width: 1200, height }}
      />
    </div>
  )
}

// `key` gives each story its own iframe and measurement.
const withEmailDocument: Decorator = (Story, context) => (
  <EmailDocument key={context.id} html={renderToStaticMarkup(<Story />)} />
)

export const decorators = [withEmailDocument]

// No padding or zoom: the screenshot is the email at the viewport width.
export const parameters = {
  argos: { fitToContent: { padding: 0, zoom: 1 } },
}
