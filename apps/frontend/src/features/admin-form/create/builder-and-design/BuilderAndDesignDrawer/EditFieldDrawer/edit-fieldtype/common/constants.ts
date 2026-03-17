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
    const optsArr = SPLIT_TEXTAREA_TRANSFORM.output(opts)
    if (!optsArr.length) return 'Please provide at least 1 option.'
    return (
      new Set(optsArr).size === optsArr.length ||
      'Please remove duplicate options.'
    )
  },
}

export const DUPLICATE_OTHERS_VALIDATION = (hasOthers: boolean) => ({
  validate: (opts: string) => {
    if (!hasOthers) return true
    const optsArr = SPLIT_TEXTAREA_TRANSFORM.output(opts)
    return (
      !optsArr.includes('Others') || "Please remove duplicate 'Others' options."
    )
  },
})
