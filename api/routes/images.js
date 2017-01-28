const express = require('express')
const router = express.Router()
const pgdb = require('../model/pgdb')
const _ = require('lodash')

const simpleAuth = require('./auth').simpleAuthMiddleware

function toSnakeCase(s){
  return s.replace(/([A-Z])/g, t=>"_"+t.toLowerCase())
}

router.get('/:imageId', simpleAuth, function(req, res, next) {
  // get posts for current user
  const imageId = req.params.imageId
  pgdb.findImage(imageId).first().then(resp=>{
    resp.b64Image = Buffer.from(resp.image).toString('base64')
    const imageData = _.pick(resp, ['image_id', 'b64Image', 'name', 'mimetype', 'width', 'height'])
    res.json(imageData)
  }).catch(err=>{
    console.error('Error getting posts', err)
    res.status(503).end()
  })
})
router.get('/:imageId/serve', function(req, res, next) {
  // get posts for current user
  const imageId = req.params.imageId
  pgdb.findImage(imageId).first().then(resp=>{
    if (!resp)
      return res.status(404).end()
    res.contentType(resp.mimetype || 'image/jpg')
    res.send(resp.image)
  }).catch(err=>{
    console.error('Error getting posts', err)
    res.status(503).end()
  })
})
router.post('/', simpleAuth, function(req, res, next) {
  const params = req.body
    // 'image', 'name', 'mimetype', 'width', 'height'
  if (!params || !params.b64Image) {
    return res.status(400).json({message:'Missing image param'})
  }
    // 'image', 'name', 'mimetype', 'width', 'height'
  // like this: http://stackoverflow.com/questions/8110294/nodejs-base64-image-encoding-decoding-not-quite-working
  params.image = Buffer.from(params.b64Image, 'base64')
  const imageData = _.pick(params, ['image', 'name', 'mimetype', 'width', 'height'])
  pgdb.addImage(imageData).then(rows=>{
    console.log('rows',rows)
    res.json({imageId: rows[0]})
  }).catch(err=>{
    console.error('Error adding image', err)
    res.status(503).end()
  })
})
router.post('/postimage', simpleAuth, function(req, res, next) {
  const params = req.body
  if (!params || !params.postId || !params.imageIds) {
    console.log('params', params)
    return res.status(400).json({message:'Missing param'})
  }
  const query = _.pick(params, ['imageIds', 'postId'])
  const imageData = query.imageIds.map((imageId, i)=>({image_id: imageId, post_id: query.postId, show_order: i}))
  pgdb.addPostImage(imageData).then(rows=>{
    res.json({success:true})
  }).catch(err=>{
    console.error('Error writing post image', err)
    res.status(503).end()
  })
})

module.exports = router
