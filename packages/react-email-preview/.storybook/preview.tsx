import { useState } from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Decorator } from '@storybook/react-vite'

// Email templates render a full <html> document, and email clients show each
// one on its own. Rendering it inside the story root nests a second <body>,
// which makes screenshots ambiguous, and flattening it into the page drops the
// <body> styles (font, background). A real document in an iframe keeps both.
const EmailDocument = ({ html }: { html: string }) => {
  const [loaded, setLoaded] = useState(false)
  return (
    // Argos waits for aria-busy to clear, so the screenshot is not taken
    // before the iframe's document and images have loaded.
    <div aria-busy={!loaded}>
      <iframe
        title="Email"
        srcDoc={`<!doctype html>${html}`}
        onLoad={() => setLoaded(true)}
        style={{ display: 'block', border: 0, width: '100vw', height: '100vh' }}
      />
    </div>
  )
}

const withEmailDocument: Decorator = (Story) => (
  <EmailDocument html={renderToStaticMarkup(<Story />)} />
)

export const decorators = [withEmailDocument]

// Capture the whole viewport rather than cropping to the story root.
export const parameters = {
  argos: { fitToContent: false },
}
