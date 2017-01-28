const pgconfig = require('./pgconfig')
const knex = require('knex')(pgconfig)
const mime = require('mime-types')
const moment = require('moment')
knex.on('query', queryData=>{
  console.log('SQL:',queryData.sql)
})


module.exports = {
  findPerson(username){
    const columns = [
      'username', 'display_name', 'email', 'gender', 'age'
    , 'country', 'is_private', 'is_admin'
    ]
    return knex.select(columns).from('person').where('username', username).where('is_active', true).first()
  }
, checkUsername(username){
    return knex.select('username').from('person').where('username', username).first()
  }
, getPersonHash(username){
    const columns = [
      'password_hash'
    ]
    return knex.select(columns).from('person').where('username', username).where('is_active', true).first()
  }
, getPerson(username){
    const columns = [
      'username', 'display_name', 'email', 'gender', 'age'
    , 'country', 'is_private', 'is_admin'
    ]
    return Promise.all([
      knex.select('image_id').from('person_photo').where('username', username).orderBy('seq', 'desc').first().then(res=>res || {})
    , knex.select(knex.raw('COUNT(1) as num_followers')).from('following').where('username', username).first()
    , knex.select(knex.raw('COUNT(1) as num_following')).from('following').where('follow_username', username).first()
    , knex.select(knex.raw('COUNT(1) as num_posts')).from('post').where('username', username).first()
    , knex.select(columns).from('person').where('username', username).where('is_active', true).first()
    ]).then(res=>Object.assign.apply({}, res))
  }
, removePerson(username){
    return knex('person').update({is_active: false}).where('username', username)
  //return knex.del().from('person').where('username', username)
  }
, updatePerson(username, fields){
    if (!username) return
    return knex('person').update(fields).where('username', username)
  }
, addProfilePhoto(username, image_id){
    return knex.insert({username, image_id}).into('person_photo')
  }
, findSession(sessionId){
    const columns = ['username']
    return knex.select(columns).from('session').where('session_id', sessionId)
    .where(function(){
      this.where('when_expire', '>', moment().toISOString()).orWhereNull('when_expire')
    }).first()
  }
, addPerson(params){
    return knex.insert(params).into('person').returning('*')
  }
, addImage(params){
    return knex.insert(params).into('image').returning('image_id')
  }
, addProfilePicture(params){
    return knex.insert(params).into('person_photo')
  }
, addSession(username, extras){
    return knex.insert(Object.assign({}, {username}, extras)).into('session').returning('session_id')
      .then(res=>res.length ? res[0] : null)
  }
, removeSession(sessionId){
    return knex.del().from('session').where('session_id', sessionId)
  }
, addPush(push_id, username, session_id){
    return knex.select('push_id').from('push_notification').where('push_id', push_id).then(res=>{
      if (!res || res.length === 0){
        return knex.insert({push_id, username, session_id}).into('push_notification')
      }
    })
  }
, removePush(sessionId){
    return knex.del().from('push_notification').where('session_id', sessionId)
  }
, addResetCode(username, reset_code){
    return knex.insert({username, reset_code}).into('reset_code')
  }
, validateResetCode(username, resetCode){
    return knex.select().from('reset_code')
      .where('username', username)
      .where('reset_code', resetCode)
      .where('when_added', '>', moment().subtract(2, 'hours').toISOString())
      .where('used', false)
      .then(res=>res && res.length === 1)
  }
, resetPassword(username, resetCode, passwordHash){
    return knex.select().from('reset_code')
      .where('username', username)
      .where('reset_code', resetCode)
      .where('when_added', '>', moment().subtract(2, 'hours').toISOString())
      .where('used', false)
      .then(res=>{
        if (!res || !res.length){
          return {message: false}
        } else {
          return knex.transaction(function(trx){
            return trx('person').update({password_hash: passwordHash}).where('username', username)
              .then(()=>
                trx('reset_code').update({used: true})
                .where('username', username)
                .where('reset_code', resetCode)
                .where('when_added', '>', moment().subtract(2, 'hours').toISOString())
              )
          })
        }
      })
  }
}
