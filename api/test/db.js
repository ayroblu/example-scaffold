const pgconfig = {
  client: 'pg',
  connection: {
    host : 'db',
    user : process.env.POSTGRES_ADMIN_USER,
    password : process.env.POSTGRES_ADMIN_PASSWORD,
    database : process.env.POSTGRES_DB
  }
}
const knex = require('knex')(pgconfig)

module.exports = {
  removePerson(username){
    // do what, set a flag then allow backend to migrate? Only issue would be username wouldn't be available immediately
    // Run migration script in node put it on a settimeout and let it run async whenever user is deleted?
    // Updates might also be a select first, then run insert async? - possible to lose data without messagequeue
    return knex.del().from('person').where('username', username)
  }
}
