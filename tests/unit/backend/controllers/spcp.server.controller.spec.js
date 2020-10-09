const crypto = require('crypto')
const { StatusCodes } = require('http-status-codes')
const mongoose = require('mongoose')

const dbHandler = require('../helpers/db-handler')

const Form = dbHandler.makeModel('form.server.model', 'Form')
const Login = dbHandler.makeModel('login.server.model', 'Login')

const Controller = spec('dist/backend/app/controllers/spcp.server.controller', {
  mongoose: Object.assign(mongoose, { '@noCallThru': true }),
})

describe('SPCP Controller', () => {
  // Declare global variables
  let req
  let res

  let testForm
  let testFormSP
  let testFormCP
  let testAgency
  let testUser

  const cpCookieMaxAge = 100 * 1000
  const spCookieMaxAge = 200 * 1000
  const spCookieMaxAgePreserved = 300 * 1000
  const idpPartnerEntityIds = { SP: 'saml.singpass', CP: 'saml.corppass' }

  const singPassAuthClient = jasmine.createSpyObj('singPassAuthClient', [
    'createRedirectURL',
    'getAttributes',
    'verifyJWT',
    'createJWT',
  ])
  const corpPassAuthClient = jasmine.createSpyObj('corpPassAuthClient', [
    'createRedirectURL',
    'getAttributes',
    'verifyJWT',
    'createJWT',
  ])

  const authClients = {
    SP: singPassAuthClient,
    CP: corpPassAuthClient,
  }

  const ndiConfig = {
    authClients,
    cpCookieMaxAge,
    spCookieMaxAgePreserved,
    spCookieMaxAge,
    idpPartnerEntityIds,
  }

  beforeAll(async () => {
    await dbHandler.connect()
  })
  afterEach(async () => await dbHandler.clearDatabase())
  afterAll(async () => await dbHandler.closeDatabase())

  beforeEach(async (done) => {
    res = jasmine.createSpyObj('res', [
      'status',
      'send',
      'json',
      'redirect',
      'cookie',
      'locals',
      'sendStatus',
    ])
    res.status.and.returnValue(res)
    res.send.and.returnValue(res)
    res.json.and.returnValue(res)
    res.cookie.and.returnValue(res)
    res.redirect.and.returnValue(res)

    // Insert test form before each test
    const collection = await dbHandler.preloadCollections({ saveForm: false })
    testAgency = collection.agency
    testUser = collection.user

    req = {
      query: {},
      params: {},
      body: {},
      session: {
        user: {
          _id: testUser._id,
          email: testUser.email,
        },
      },
      headers: {},
      ip: '127.0.0.1',
    }

    testForm = new Form({
      title: 'Test Form',
      emails: req.session.user.email,
      admin: req.session.user._id,
      authType: 'NIL',
    })
    testFormSP = new Form({
      title: 'Test Form SP',
      emails: req.session.user.email,
      admin: req.session.user._id,
      esrvcId: 'FORMSG-SINGPASS',
    })
    testFormCP = new Form({
      title: 'Test Form CP',
      emails: req.session.user.email,
      admin: req.session.user._id,
      esrvcId: 'FORMSG-CORPPASS',
    })

    await Promise.all([testForm.save(), testFormSP.save(), testFormCP.save()])
      .then(() => {
        // Need to have access to admin and agency to update authType
        let updateAuthType = (form, authType) => {
          return Form.findByIdAndUpdate(form._id, { authType }).populate({
            path: 'admin',
            populate: {
              path: 'agency',
              model: 'Agency',
            },
          })
        }
        return Promise.all([
          updateAuthType(testFormSP, 'SP'),
          updateAuthType(testFormCP, 'CP'),
        ])
      })
      .then(() => {
        done()
      })
  })

  let generateArtifact = (entityId) => {
    let hashedEntityId = crypto
      .createHash('sha1')
      .update(entityId, 'utf8')
      .digest('hex')
    let hexArtifact =
      '00040000' + hashedEntityId + 'e436913660e3e917549a59709fd8c91f2120222f'
    let b64Artifact = Buffer.from(hexArtifact, 'hex').toString('base64')
    return b64Artifact
  }

  const expectRedirectOn = (login, url, cb) => {
    res.redirect.and.callFake((input) => {
      expect(input).toEqual(url)
      if (cb) cb()
      return res
    })
    login(req, res)
  }

  const expectResponse = (code, content) => {
    if (content) {
      expect(res.status).toHaveBeenCalledWith(code)
      expect(res.json).toHaveBeenCalledWith(content)
    } else {
      expect(res.sendStatus).toHaveBeenCalledWith(code)
    }
  }

  describe('createSpcpRedirectURL', () => {
    let expectedParam
    let next
    beforeEach(() => {
      expectedParam = {
        target: 'www.form.gov.sg/targetForm',
        authType: 'NIL',
        esrvcId: 'esrvcId',
      }
      req.query = _.cloneDeep(expectedParam)
      next = jasmine.createSpy()
    })

    it('should return 400 if target not provided', () => {
      req.query.target = ''
      Controller.createSpcpRedirectURL(authClients)(req, res, next)
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Redirect URL malformed',
      })
    })

    it('should return 400 if authType not provided', () => {
      req.query.authType = ''
      Controller.createSpcpRedirectURL(authClients)(req, res, next)
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Redirect URL malformed',
      })
    })
    it('should return 400 if esrvcId not provided', () => {
      req.query.esrvcId = ''
      Controller.createSpcpRedirectURL(authClients)(req, res, next)
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Redirect URL malformed',
      })
    })
    it('should return 400 if authType is NIL', () => {
      Controller.createSpcpRedirectURL(authClients)(req, res, next)
      expect(res.status).toHaveBeenCalledWith(400)
      expect(res.json).toHaveBeenCalledWith({
        message: 'Redirect URL malformed',
      })
    })
    it('should return 200 and redirectUrl if authType is SP', () => {
      req.query.authType = 'SP'
      let expectedUrl = {
        redirectURL: 'www.redirectUrlForSP.com',
      }
      singPassAuthClient.createRedirectURL.and.callFake((target, esrvcId) => {
        expect(target).toEqual(expectedParam.target)
        expect(esrvcId).toEqual(expectedParam.esrvcId)
        return expectedUrl.redirectURL
      })
      Controller.createSpcpRedirectURL(authClients)(req, res, next)
      expect(next).toHaveBeenCalled()
      Controller.returnSpcpRedirectURL(req, res)
      expectResponse(StatusCodes.OK, expectedUrl)
    })
    it('should return 200 and redirectUrl if authType is CP', () => {
      req.query.authType = 'CP'
      let expectedUrl = {
        redirectURL: 'www.redirectUrlForCP.com',
      }
      corpPassAuthClient.createRedirectURL.and.callFake((target, esrvcId) => {
        expect(target).toEqual(expectedParam.target)
        expect(esrvcId).toEqual(expectedParam.esrvcId)
        return expectedUrl.redirectURL
      })
      Controller.createSpcpRedirectURL(authClients)(req, res, next)
      expect(next).toHaveBeenCalled()
      Controller.returnSpcpRedirectURL(req, res)
      expectResponse(StatusCodes.OK, expectedUrl)
    })
  })

  describe('isSpcpAuthenticated', () => {
    let next

    beforeEach(() => {
      req = {
        form: { authType: 'SP' },
        cookies: { jwtSp: 'spCookie' },
        headers: {},
        ip: '127.0.0.1',
        get: (key) => this[key],
      }
      next = jasmine.createSpy()
    })

    const replyWith = (error, data) => {
      singPassAuthClient.verifyJWT.and.callFake((jwt, cb) => {
        expect(jwt).toEqual('spCookie')
        cb(error, data)
      })
    }

    const passThroughWith = (data) => {
      next = jasmine.createSpy().and.callFake(() => {
        expect(res.locals.uinFin).toEqual(data.userName)
        expect(res.locals.userInfo).toEqual(data.userInfo)
      })
    }

    it('should call next if authType undefined', () => {
      req.form.authType = ''
      Controller.isSpcpAuthenticated(authClients)(req, res, next)
      expect(next).toHaveBeenCalled()
    })

    it('should call next if authType is NIL', () => {
      req.form.authType = 'NIL'
      Controller.isSpcpAuthenticated(authClients)(req, res, next)
      expect(next).toHaveBeenCalled()
    })

    it('should return 401 if verify returns error', () => {
      replyWith('error', {})
      Controller.isSpcpAuthenticated(authClients)(req, res, next)
      expect(next).not.toHaveBeenCalled()
      expectResponse(StatusCodes.UNAUTHORIZED, {
        message: 'User is not SPCP authenticated',
        spcpSubmissionFailure: true,
      })
    })

    it('should call next and set username if verify succeeds', () => {
      replyWith(null, {
        userName: '123',
        userInfo: 'abc',
      })
      passThroughWith({
        userName: '123',
        userInfo: 'abc',
      })
      Controller.isSpcpAuthenticated(authClients)(req, res, next)
      expect(next).toHaveBeenCalled()
    })
  })

  describe('addSpcpSessionInfo', () => {
    let next

    beforeEach(() => {
      req = {
        form: { authType: 'SP' },
        cookies: { jwtSp: 'spCookie' },
        headers: {},
        ip: '127.0.0.1',
        get: (key) => this[key],
      }
      res.locals = {}
    })

    const expectPassthroughWith = (session, cb) => {
      next = jasmine.createSpy().and.callFake(() => {
        if (!session) {
          expect(res.locals).toEqual({})
        } else {
          expect(res.locals.spcpSession.userName).toEqual(session.userName)
        }
        cb()
      })
      Controller.addSpcpSessionInfo(authClients)(req, res, next)
    }

    const replyWith = (error, data) => {
      singPassAuthClient.verifyJWT.and.callFake((jwt, cb) => {
        expect(jwt).toEqual('spCookie')
        cb(error, data)
      })
    }

    it('should call next if authType is NIL', (done) => {
      req.form.authType = 'NIL'
      expectPassthroughWith(null, done)
    })

    it('should call next if authType undefined', (done) => {
      req.form.authType = ''
      expectPassthroughWith(null, done)
    })

    it('should call next if cookie undefined', (done) => {
      req.cookies.jwtSp = ''
      expectPassthroughWith(null, done)
    })

    it('should not update spcpSession if verifyJWT fails', (done) => {
      req.form.authType = 'SP'
      replyWith('error', {})
      expectPassthroughWith(null, done)
    })

    it('should update spcpSession if verifyJWT succeeds', (done) => {
      req.form.authType = 'SP'
      replyWith(null, {
        userName: 'abc',
      })
      expectPassthroughWith(
        {
          userName: 'abc',
        },
        done,
      )
    })
  })

  describe('singPassLogin/corpPassLogin - validation', () => {
    let spB64Artifact
    let expectedRelayState

    const expectBadRequestOnLogin = (statusCode, done) => {
      res.sendStatus.and.callFake((status) => {
        expect(status).toEqual(statusCode)
        done()
        return res
      })
      Controller.singPassLogin(ndiConfig)(req, res)
    }

    const replyWith = (error, data) => {
      singPassAuthClient.getAttributes.and.callFake(
        (samlArt, relayState, cb) => {
          expect(samlArt).toEqual(spB64Artifact)
          expect(relayState).toEqual(expectedRelayState)
          cb(error, data)
        },
      )
    }

    beforeEach(() => {
      spB64Artifact = generateArtifact('saml.singpass')
      expectedRelayState = '/' + testFormSP._id
      req.query = {
        SAMLart: spB64Artifact,
        RelayState: `/${testFormSP._id},true`,
      }
    })

    it('should return 401 if artifact not provided', () => {
      req.query.SAMLart = ''
      Controller.singPassLogin(ndiConfig)(req, res)
      expectResponse(StatusCodes.UNAUTHORIZED)
    })

    it('should return 400 if relayState not provided', () => {
      req.query.RelayState = ''
      Controller.singPassLogin(ndiConfig)(req, res)
      expectResponse(StatusCodes.BAD_REQUEST)
    })

    it('should return 401 if artifact is invalid', () => {
      req.query.SAMLart = '123456789'
      Controller.singPassLogin(ndiConfig)(req, res)
      expectResponse(StatusCodes.UNAUTHORIZED)
    })

    it('should return 400 if relayState is invalid format', () => {
      req.query.RelayState = '/invalidRelayState'
      Controller.singPassLogin(ndiConfig)(req, res)
      expectResponse(StatusCodes.BAD_REQUEST)
    })

    it('should return 404 if relayState has valid format but invalid formId', (done) => {
      req.query.RelayState = '/123,false'
      expectBadRequestOnLogin(StatusCodes.NOT_FOUND, done)
    })

    it('should return 401 if relayState has valid format but belongs to non SP form', (done) => {
      req.query.RelayState = `$/{testForm._id},false`
      expectBadRequestOnLogin(StatusCodes.UNAUTHORIZED, done)
    })

    it('should redirect to relayState with login error if getAttributes returns relayState only', (done) => {
      replyWith(null, { relayState: expectedRelayState })
      expectRedirectOn(
        Controller.singPassLogin(ndiConfig),
        expectedRelayState,
        () => {
          expect(res.cookie).toHaveBeenCalledWith('isLoginError', true)
          done()
        },
      )
    })
  })

  describe('Integration with SPCPAuthClient', () => {
    const jwt = 'someUniqueJwt'

    const checkArtifactOnGetAttributes = (artifact) => (
      authClient,
      error,
      data,
    ) => {
      authClient.getAttributes.and.callFake((samlArt, relayState, cb) => {
        expect(samlArt).toEqual(artifact)
        expect(relayState).toEqual(data.relayState)
        cb(error, data)
      })
    }

    const expectJWTCreation = (authClient, data, cookieDuration) => {
      expect(authClient.createJWT).toHaveBeenCalledWith(
        jasmine.objectContaining(
          data.UserInfo
            ? { userName: data.UserName, userInfo: data.UserInfo }
            : { userName: data.UserName },
        ),
        cookieDuration / 1000,
      )
    }

    const expectSetCookie = (name, value, options) =>
      expect(res.cookie).toHaveBeenCalledWith(name, value, options)

    const expectLoginLogged = (searchCriteria, authType, done) => {
      Login.findOne(searchCriteria, (err, login) => {
        expect(err).not.toBeTruthy()
        expect(login.authType).toEqual(authType)
        expect(login.agency).toEqual(testAgency._id)
        expect(login.created).toBeCloseTo(Date.now(), -3)
        done()
      })
    }

    describe('singPassLogin', () => {
      const spB64Artifact = generateArtifact('saml.singpass')
      let expectedRelayState

      const getAttributesWith = checkArtifactOnGetAttributes(spB64Artifact)

      beforeEach(() => {
        expectedRelayState = '/' + testFormSP._id
        req.query = {
          SAMLart: spB64Artifact,
          RelayState: `/${testFormSP._id},false`,
        }
      })

      it('should redirect to relayState with cookie and add to DB if getAttributes returns relayState (non preview) and userName', (done) => {
        const expected = {
          relayState: expectedRelayState,
          attributes: { UserName: '123' },
        }
        getAttributesWith(singPassAuthClient, null, expected)
        singPassAuthClient.createJWT.and.returnValue(jwt)
        expectRedirectOn(
          Controller.singPassLogin(ndiConfig),
          expected.relayState,
          () => {
            expectJWTCreation(
              singPassAuthClient,
              expected.attributes,
              spCookieMaxAge,
            )
            expectSetCookie('jwtSp', jwt, {
              maxAge: spCookieMaxAge,
              httpOnly: false,
              sameSite: 'lax',
              secure: false,
            })
            let searchCriteria = {
              form: testFormSP._id,
              admin: req.session.user._id,
            }
            expectLoginLogged(searchCriteria, 'SP', done)
          },
        )
      })

      it('should redirect to relayState with cookie and add to DB if getAttributes returns relayState (preview) and userName', (done) => {
        expectedRelayState += '/preview'
        req.query.RelayState = `/${testFormSP._id}/preview,false`
        const expected = {
          relayState: expectedRelayState,
          attributes: { UserName: '123' },
        }
        getAttributesWith(singPassAuthClient, null, expected)
        singPassAuthClient.createJWT.and.returnValue(jwt)
        expectRedirectOn(
          Controller.singPassLogin(ndiConfig),
          expected.relayState,
          () => {
            expectJWTCreation(
              singPassAuthClient,
              expected.attributes,
              spCookieMaxAge,
            )
            expectSetCookie('jwtSp', jwt, {
              maxAge: spCookieMaxAge,
              httpOnly: false,
              sameSite: 'lax',
              secure: false,
            })
            let searchCriteria = {
              form: testFormSP._id,
              admin: req.session.user._id,
            }
            expectLoginLogged(searchCriteria, 'SP', done)
          },
        )
      })
    })

    describe('corpPassLogin', () => {
      const cpB64Artifact = generateArtifact('saml.corppass')
      let expectedRelayState

      const getAttributesWith = checkArtifactOnGetAttributes(cpB64Artifact)

      beforeEach(() => {
        expectedRelayState = '/' + testFormCP._id
        req.query = {
          SAMLart: cpB64Artifact,
          RelayState: `/${testFormCP._id},false`,
        }
      })

      it('should redirect to relayState with cookie and add to DB if getAttributes returns relayState (non preview) and userName', (done) => {
        const expected = {
          relayState: expectedRelayState,
          attributes: { UserInfo: { CPEntID: '123', CPUID: 'abc' } },
        }
        getAttributesWith(corpPassAuthClient, null, expected)
        corpPassAuthClient.createJWT.and.returnValue(jwt)
        expectRedirectOn(
          Controller.corpPassLogin(ndiConfig),
          expected.relayState,
          () => {
            expectJWTCreation(
              corpPassAuthClient,
              { UserName: '123', UserInfo: 'abc' },
              cpCookieMaxAge,
            )
            expectSetCookie('jwtCp', jwt, {
              maxAge: cpCookieMaxAge,
              httpOnly: false,
              sameSite: 'lax',
              secure: false,
            })
            let searchCriteria = {
              form: testFormCP._id,
              admin: req.session.user._id,
            }
            expectLoginLogged(searchCriteria, 'CP', done)
          },
        )
      })

      it('should redirect to relayState with cookie and add to DB if getAttributes returns relayState (preview) and userName', (done) => {
        req.query.RelayState = '/' + testFormCP._id + '/preview,false'
        expectedRelayState += '/preview'
        const expected = {
          relayState: expectedRelayState,
          attributes: { UserInfo: { CPEntID: '123', CPUID: 'abc' } },
        }
        getAttributesWith(corpPassAuthClient, null, expected)
        corpPassAuthClient.createJWT.and.returnValue(jwt)
        expectRedirectOn(
          Controller.corpPassLogin(ndiConfig),
          expected.relayState,
          () => {
            expectJWTCreation(
              corpPassAuthClient,
              { UserName: '123', UserInfo: 'abc' },
              cpCookieMaxAge,
            )
            expectSetCookie('jwtCp', jwt, {
              maxAge: cpCookieMaxAge,
              httpOnly: false,
              sameSite: 'lax',
              secure: false,
            })
            let searchCriteria = {
              form: testFormCP._id,
              admin: req.session.user._id,
            }
            expectLoginLogged(searchCriteria, 'CP', done)
          },
        )
      })
    })
  })
})
