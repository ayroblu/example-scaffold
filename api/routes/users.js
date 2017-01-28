const express = require('express')
const router = express.Router()
const pgauth = require('../model/pgauth')
const pgdb = require('../model/pgdb')
const auth = require('./auth').authenticationMiddleware
const simpleAuth = require('./auth').simpleAuthMiddleware
const authLogout = require('./auth').logout
const passport = require('passport')
const bcrypt = require('bcryptjs')
const emailer = require('../emailer')
const _ = require('lodash')

function randomInt(low, high){
  return Math.floor(Math.random() * (high - low + 1) + low)
}
function toCamelCase(s){
  return s.replace(/(_[a-z])/g, t=>t.toUpperCase().replace('_',''));
}
function camelCaseObject(object){
  return Object.keys(object).reduce((o, k)=>{
    o[toCamelCase(k)] = object[k]
    return o
  }, {})
}
function toSnakeCase(s){
  return s.replace(/([A-Z])/g, t=>"_"+t.toLowerCase())
}
function snakeCaseObject(object){
  return Object.keys(object).reduce((o, k)=>{
    o[toSnakeCase(k)] = object[k]
    return o
  }, {})
}

router.post('/', simpleAuth, passport.authenticate('register', {session: false}), function(req, res, next) {
  if (!req.token){
    return res.status(403).json({err: 'Sorry, looks like auth worked but we haven\'t worked out how to give you a token!'})
  }
  res.json({token: req.token})
})
router.post('/facebooklogin', simpleAuth, function(req, res, next) {
  const {user, facebookData, accessToken, os} = req.body
  if (!user || !facebookData || !accessToken || !os) {
    return res.status(400).json({message: 'Need the user, accesstoken and facebook data'})
  }
  pgauth.getFacebookById(facebookData.id).then(resp=>{
    if ((!resp) && !user.username){
      return res.status(400).json({message: 'Pass a username!'})
    }
    if (!resp) {
      // this is where you register a user
      return pgauth.checkUsername(user.username).then(result=>{
        if (result){
          return res.status(400).json({message: 'Username already exists'})
        }
        let params = _.pick(user, ['email', 'gender', 'age', 'country', 'isPrivate', 'displayName'])
        params = snakeCaseObject(params)
        const password = Array(14).fill().map(()=>randomInt(0,9)).join('')
        params = Object.assign({}, params, {username: user.username, password_hash: bcrypt.hashSync(password, 10)})
        const facebookParams = {
          username: user.username
        , facebook_id: facebookData.id
        , access_token: accessToken
        , facebook_data: facebookData
        }
        return pgauth.addFacebookPerson(facebookParams, params).then(r=>{
          return pgauth.addSession(user.username, {ipaddress: req.connection.remoteAddress, os}).then(token=>{
            res.json({token})
          })
        })
      })
    } else {
      // User is already registered
      return pgauth.addSession(resp.username, {ipaddress: req.connection.remoteAddress, os}).then(token=>{
        res.json({username: resp.username, token})
      })
    }
  }).catch(err=>{
    console.error('Error logging in with facebook', err)
    res.status(503).end()
  })
})
router.post('/login', simpleAuth, passport.authenticate('login', {session: false}), function(req, res, next) {
  if (!req.token){
    return res.status(403).json({err: 'Sorry, looks like auth worked but we haven\'t worked out how to give you a token!'})
  }
  pgauth.getPerson(req.username).then(user=>{
    user.token = req.token
    user = camelCaseObject(user)
    user.numFollowers = parseInt(user.numFollowers)
    user.numFollowing = parseInt(user.numFollowing)
    user.numPosts = parseInt(user.numPosts)
    res.json(user)
  }).catch(err=>{
    console.error('db error getting user', err)
    res.status(503).end()
  })
})
router.post('/addpush', auth, function(req, res, next){
  const {pushId} = req.body
  pgauth.addPush(pushId, req.username, req.token).then(resp=>{
    return res.json({success: true})
  }).catch(err=>{
    console.error('Error adding push id to db', err)
    return res.status(503).end()
  })
})
router.get('/logout', auth, function(req, res, next){
  console.log('sessionId', req.token)
  pgauth.removePush(req.token).catch(err=>{
    console.error('Error removing push id to db', err)
  })
  authLogout(req.token).then(rows=>{
    if (!rows)
      console.error('No rows deleted from sessions?', rows)
    return res.json({message: 'You\'ve been logged out!'})
  }).catch(err=>{
    console.error('Error logging out:', err)
    res.status(503).end()
  })
  req.logout()
})
router.post('/forgotpassword', simpleAuth, function(req, res, next) {
  // insert reset code
  const resetCode = Array(14).fill().map(()=>randomInt(0,9)).join('')
  const {email} = req.body
  if (!resetCode || !email) {
    return res.status(400).json({message: 'We require an email address'})
  }
  // given email, get usernames, then add reset codes for each username
  let username = null
  pgauth.getPersonFromEmail(email).then(row=>{
    if (!row || !row.username) {
      res.status(400).json({message: 'User not found for email'})
      return new Promise(()=>{})
    }
    username = row.username
    return pgauth.addResetCode(username, resetCode)
  }).then(()=>{
    return emailer.sendResetEmail(email, resetCode)
  }).then(()=>{
    res.json({username})
  }).catch(err=>{
    console.error('Error creating reset code:', err, '\n For: resetCode:', resetCode, 'email', email)
    res.status(503).end()
  })
  // send email
  //res.status(501).end()
})
router.get('/forgotpassword/:resetCode', simpleAuth, function(req, res, next) {
  //get email
  const {username} = req.query
  const resetCode = req.params.resetCode
  if (!username){
    return res.status(400).json({message: 'No username included'})
  }
  pgauth.validateResetCode(username, resetCode).then(valid=>
    res.json({valid})
  ).catch(err=>{
    console.error('Error validating reset code:', err)
    res.status(503).end()
  })
})
router.post('/forgotpassword/:resetCode', simpleAuth, function(req, res, next) {
  const {username, password} = req.body
  if (!username){
    return res.status(400).json({message: 'username is missing'})
  }
  if (!password){
    return res.status(400).json({message: 'password is missing'})
  }
  const resetCode = req.params.resetCode
  if (!resetCode){
    return res.status(400).json({message: 'Reset code is not present in request'})
  }
  const passwordHash = bcrypt.hashSync(password, 10)
  pgauth.resetPassword(username, resetCode, passwordHash)
    .then(result=>{
      if (result && result.message === false) {
        res.status(400).json({message: 'Reset code was not valid'})
      } else {
        res.json({success: true})
      }
    }).catch(err=>{
      console.error('forgotpassword, reset err:', err)
      res.status(503).end()
    })
})
router.post('/findusers', auth, function(req, res, next) {
  const {text} = req.body
  pgdb.findPeople(req.username, text, text)
    .then(people=>{
      people = people.map(p=>camelCaseObject(p))
      res.json({people})
    }).catch(err=>{
      console.error('finduser err:', err)
      res.status(503).end()
    })
})
router.get('/getuser/:username', auth, function(req, res, next) {
  const username = req.params.username
  pgdb.getUser(username, req.username)
    .then(user=>{
      user = camelCaseObject(user)
      user.posts = user.posts.map(p=>camelCaseObject(p)).map(p=>{
        const wineDetails = _.pick(p, [
          'wineType', 'grapeVariety', 'countryOfOrigin', 'region', 'vintage', 'vineyard'
        ])
        const post = _.pick(p, [
          'postId', 'description', 'whenAdded', 'images', 'rating'
        ])
        post.wineDetails = wineDetails
        return post
      })
      res.json(user)
    }).catch(err=>{
      console.error('getuser err:', err)
      res.status(503).end()
    })
})

module.exports = router
