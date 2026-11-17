// @ts-check
'use strict'

/**
 * Simple token-bucket rate limiter. One bucket shared across all phases —
 * pass the same instance through.
 *
 * `take()` resolves when a token is available. Tokens refill continuously
 * at `ratePerSec` rate; bucket capacity is also `ratePerSec` (1 second of burst).
 */
class TokenBucket {
  /** @param {number} ratePerSec */
  constructor(ratePerSec) {
    if (!(ratePerSec > 0)) {
      throw new Error('ratePerSec must be > 0')
    }
    this.rate = ratePerSec
    this.capacity = ratePerSec
    this.tokens = ratePerSec
    this.lastRefill = Date.now()
  }

  _refill() {
    const now = Date.now()
    const elapsedSec = (now - this.lastRefill) / 1000
    if (elapsedSec <= 0) return
    this.tokens = Math.min(this.capacity, this.tokens + elapsedSec * this.rate)
    this.lastRefill = now
  }

  async take() {
    while (true) {
      this._refill()
      if (this.tokens >= 1) {
        this.tokens -= 1
        return
      }
      const deficit = 1 - this.tokens
      const waitMs = Math.max(1, Math.ceil((deficit / this.rate) * 1000))
      await new Promise((r) => setTimeout(r, waitMs))
    }
  }
}

module.exports = { TokenBucket }
