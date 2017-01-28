const passport = require('passport')
const FacebookStrategy = require('passport-facebook').Strategy
const path = require('path')
const pgauth = require('../../model/pgauth')
const debug = require('debug')('example-api:server')

//TODO: Remove this page, use device based auth, can pull from already logged in accounts
module.exports = {
  initFacebookAuth
}

const keys = {
  clientID: process.env.FACEBOOK_APP_ID,
  clientSecret: process.env.FACEBOOK_APP_SECRET,
  callbackURL: path.join((process.env.PRODUCTION_DOMAIN || "http://localhost:5001"), "/users/facebook/success")
}

class handleExternalAuth {
  _addExternalUser(){
  }
  _fetchImages(){
  }
  _addLocalUser(){
  }
  run(profile){
    let params = ['provider', 'id', 'displayName'].reduce((a, n)=>{
      a[n] = profile[n]
      return a
    }, {})
    Object.assign(params, ['name', 'emails', 'photos'].reduce((a, n)=>{
      a[n] = JSON.stringify(profile[n])
      return a
    }, {}))
    pgauth.findExternalUser(params.provider, params.id)
      .then(exUser=>{
        if (!exUser){
          return this.addExternalUser(params)
          .then(user=>{
            return user
          })
        }
        return exUser
      }).then(user=>{
        this.fetchImages(profile.photos)
      })
    //const localParams = {}
    //this.addLocalUser(localParams)
  }
}
// profile callback data can be seen at http://passportjs.org/docs/profile
function initFacebookAuth(){
  passport.use('facebook', new FacebookStrategy(keys, function(accessToken, refreshToken, profile, done) {
    // Okay, so here's how this works, once the user auth's themselves, pull their profile info and try to match them
    // we were just going to fill in all fields? give them option to change username + ... (Are you happy with xyz)
   
    // 1. find a user: search by provider and id
    // 1a. create a external_auth user
    // 2. 
    //pgauth.findFacebookPerson(profile.username?)
    //User.findOrCreate(..., function(err, user) {
    //  if (err) { return done(err) }
    //  done(null, user)
    //})
  }))
}
