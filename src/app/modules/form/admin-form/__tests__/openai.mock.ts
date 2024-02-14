export const openaiMock = {
  chat: {
    completions: {
      create: jest
        .fn()
        .mockRejectedValue(new Error('Some random error message')),
    },
  },
}
