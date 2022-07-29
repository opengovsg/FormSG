export const SPLIT_TEXTAREA_TRANSFORM = {
  input: (optsArr: string[]) => optsArr.filter(Boolean).join('\n'),
  output: (optsString: string) =>
    optsString
      .split('\n')
      .map((opt) => opt.trim())
      .filter(Boolean),
}

export const SPLIT_TEXTAREA_VALIDATION = {
  validate: (opts: string) => {
    if (!opts) return 'Please provide at least 1 option.'
    const optsArr = SPLIT_TEXTAREA_TRANSFORM.output(opts)
    return (
      new Set(optsArr).size === optsArr.length ||
      'Please remove duplicate options.'
    )
  },
}
