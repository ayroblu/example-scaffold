const passport = require('passport')  
const LocalStrategy = require('passport-local').Strategy
const pgauth = require('../../model/pgauth')
const bcrypt = require('bcryptjs')
const debug = require('debug')('example-api:server')
const _ = require('lodash')

function toSnakeCase(s){
  return s.replace(/([A-Z])/g, t=>"_"+t.toLowerCase())
}

module.exports = {
  initLocalAuth
, logout
}

// Three strategies, register, login, and logout (which is just a func)
function initLocalAuth(){
  passport.use('register', new LocalStrategy({
      passReqToCallback : true
    }
  , function(req, username, password, done) {
      pgauth.findPerson(username)
      .then(res=>{
        if (res){
          debug('User already exists')
          done(null, false, {message: 'username exists'})
          return new Promise((a,r)=>{})
        }
      }).then(()=>{
        let params = _.pick(req.body, ['email', 'gender', 'age', 'country', 'isPrivate', 'displayName'])
        params = Object.keys(params).reduce((o, k)=>{
          o[toSnakeCase(k)] = params[k]
          return o
        }, {})
        // also profile photo
        return Object.assign({}, params, {username, password_hash: bcrypt.hashSync(password, 10)})
      }).then(data=>{
        return pgauth.addPerson(data)
      }).then(res=>{
        debug('Great! New user as User')
        return pgauth.addSession(username, {ipaddress: req.connection.remoteAddress, os: req.body.os})
      }).then(session_id=>{
        debug('session for user created, token passed back', session_id)
        req.token = session_id
        return done(null, session_id)
      }).catch(err=>{
        console.error('Error creating a user', err)
        return done(err)
      })
    }
  ))
  passport.use('login', new LocalStrategy({
      passReqToCallback: true
    }
  , function(req, username, password, done) {
      // not exists, find in db?
      pgauth.getPersonHash(username)
      .then(user=>{
        if (!user){
          debug('user not found:', username)
          return done(null, false)
        }
        if (!bcrypt.compareSync(password, user.password_hash)) {
          return done(null, false)
        }
        return pgauth.addSession(username, {ipaddress: req.connection.remoteAddress, os: req.body.os})
        .then(session_id=>{
          req.token = session_id
          req.username = username
          return done(null, session_id)
        })
      })
      .catch(err=>{
        return done(err)
      })
    }
  ))
}
function logout(sessionId) {
  return pgauth.removeSession(sessionId)
}
