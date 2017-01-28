const pgconfig = require('./pgconfig')
const knex = require('knex')(pgconfig)
knex.on('query', queryData=>{
  console.log('SQL:',queryData.sql, '----', queryData.bindings)
})

module.exports = {
  findImage(imageId){
    const columns = [
      'image_id', 'image', 'name', 'mimetype', 'width', 'height'
    ]
    return knex.select(columns).from('image').where('image_id', imageId)
    // Handle visibility in where constraint
  }
, addImage(imageData){
    // 'image', 'name', 'mimetype', 'width', 'height'
    return knex.insert(imageData).into('image').returning('image_id')
  }
}
