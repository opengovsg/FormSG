// Keep import() in JavaScript so ts-jest does not convert this ESM import to require().
module.exports = () => import('openid-client')
