const passport = require('passport')  
const pgauth = require('../../model/pgauth')
const debug = require('debug')('example-api:server')
const localAuth = require('./local')
const facebookAuth = require('./facebook')

// Passport serializers
passport.serializeUser(function (user, cb) {
  cb(null, user.username)
})

passport.deserializeUser(function (username, cb) {
  pgauth.findPerson(username).then(user=>{
    if (user) {
      cb(null, user)
    } else {
      cb(null)
    }
  }).catch(err=>{
    cb(null)
  })
})

localAuth.initLocalAuth()
// facebookAuth.initFacebookAuth()

function authenticationMiddleware(req, res, next) {
  //if (req.isAuthenticated()) { //I believe this is sessions
  //  return next()
  //}
  //Go in to database and check if session token is active
  //res.redirect('/') // alternatively, redirect to login with the redirect back url - not for api - return 403
  const authHeader = req.get('Authorization')
  if (authHeader){
    const m = /^Bearer (.+)$/.exec(authHeader)
    if (m) {
      const token = m[1]
      return pgauth.findSession(token).then(resp=>{
        if (resp){
          req.token = token
          req.username = resp.username
          next()
        } else {
          debug('Session is no longer valid token:' + token)
          res.status(401).end()
        }
      }).catch(err=>{
        console.error('could not access session:', err)
        res.status(503).end()
      })
    } else {
      debug('No token found')
    }
  } else {
    debug('No auth header received')
  }
  return res.status(401).end()
}
function simpleAuthMiddleware(req, res, next) {
  const authHeader = req.get('Authorization')
  if (authHeader){
    const m = /^Bearer (.+)$/.exec(authHeader)
    if (m) {
      const token = m[1]
      if (token === 'pf2gqi5lmw1rxpggy14i') {
        return next()
      }
      debug('Token is incorrect')
    } else {
      debug('No token found')
    }
  } else {
    debug('No auth header received')
  }
  return res.status(401).end()
}

module.exports = {
  authenticationMiddleware
, simpleAuthMiddleware
, logout: localAuth.logout
}
