const getRequestIp = (req) => req.get('cf-connecting-ip') || req.ip
module.exports = {
  getRequestIp,
}
