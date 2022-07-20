const { clickSwitchToReact } = require('./helpers/util')

fixture('Switch environments').beforeEach(async (t) => {
  await t.resizeWindow(1280, 800)
})

test.before(async (t) => {
  await clickSwitchToReact(t)
})
