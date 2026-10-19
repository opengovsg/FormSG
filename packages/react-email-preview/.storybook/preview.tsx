import type { Decorator } from '@storybook/react-vite'
import { renderToStaticMarkup } from 'react-dom/server'

// Email templates render a full <html> document. React would nest a second
// <html>/<body> inside the story root, which makes screenshots ambiguous.
// Serialising the markup lets the browser parser drop the extra wrappers.
// The markup comes from our own templates and story args, never user input.
const withFlattenedDocument: Decorator = (Story) => (
  <div dangerouslySetInnerHTML={{ __html: renderToStaticMarkup(<Story />) }} />
)

export const decorators = [withFlattenedDocument]

// Capture the whole viewport rather than cropping to the story root.
export const parameters = {
  argos: { fitToContent: false },
}
