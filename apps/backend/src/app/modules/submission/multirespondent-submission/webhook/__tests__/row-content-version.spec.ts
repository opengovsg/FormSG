import {
  getRowContentVersion,
  RowConsumerClass,
  RowContentVersion,
} from '../row-content-version'

const ALL_CONSUMER_CLASSES: RowConsumerClass[] = ['none', 'plumber', 'generic']

describe('getRowContentVersion', () => {
  // Exhaustive: every consumer class x every value of the one flag the gate
  // reads. `enable-mrf-webhooks` is deliberately not an input in this slice —
  // no row depends on it (PRD #9803 R7).
  it.each<{
    name: string
    consumerClass: RowConsumerClass
    isStepWriteTokenEnabled: boolean
    expected: RowContentVersion
  }>([
    {
      name: 'no webhook, write-guard off => V4',
      consumerClass: 'none',
      isStepWriteTokenEnabled: false,
      expected: 2,
    },
    {
      name: 'no webhook, write-guard on => V4',
      consumerClass: 'none',
      isStepWriteTokenEnabled: true,
      expected: 2,
    },
    {
      name: 'plumber, write-guard on => V4',
      consumerClass: 'plumber',
      isStepWriteTokenEnabled: true,
      expected: 2,
    },
    {
      name: 'plumber, write-guard off => V3',
      consumerClass: 'plumber',
      isStepWriteTokenEnabled: false,
      expected: 1,
    },
    {
      name: 'generic, write-guard off => V3',
      consumerClass: 'generic',
      isStepWriteTokenEnabled: false,
      expected: 1,
    },
    {
      // Security: a generic consumer must never get a V4 row while the send
      // path would deliver it via the legacy live-row view.
      name: 'generic, write-guard on => V3',
      consumerClass: 'generic',
      isStepWriteTokenEnabled: true,
      expected: 1,
    },
  ])('$name', ({ consumerClass, isStepWriteTokenEnabled, expected }) => {
    expect(
      getRowContentVersion({ consumerClass, isStepWriteTokenEnabled }),
    ).toBe(expected)
  })

  it('pins a generic consumer to V3 for every flag combination', () => {
    for (const isStepWriteTokenEnabled of [false, true]) {
      expect(
        getRowContentVersion({
          consumerClass: 'generic',
          isStepWriteTokenEnabled,
        }),
      ).toBe(1)
    }
  })

  // Parity invariant: with the flag off the table reduces exactly to develop's
  // `hasWebhook ? 1 : 2`, so flag-off row storage is byte-identical.
  it('with the write-guard flag off, reduces exactly to hasWebhook ? 1 : 2', () => {
    for (const consumerClass of ALL_CONSUMER_CLASSES) {
      const hasWebhook = consumerClass !== 'none'
      expect(
        getRowContentVersion({ consumerClass, isStepWriteTokenEnabled: false }),
      ).toBe(hasWebhook ? 1 : 2)
    }
  })
})
