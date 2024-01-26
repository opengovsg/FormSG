export const parseModelOutput = (content: string) => {
  const splitByDashes = content.split('---')
  if (splitByDashes.length !== 3) {
    throw new Error('Invalid reply from model')
  }
  return splitByDashes[1].trim()
}
