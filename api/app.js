const express = require('express')
const path = require('path')
const favicon = require('serve-favicon')
const logger = require('morgan')
//const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const passport = require('passport')
const stylus = require('stylus')
const autoprefixer = require('autoprefixer-stylus')

const routes = require('./routes/index')
const posts = require('./routes/posts')
const post = require('./routes/post')
const users = require('./routes/users')
const user = require('./routes/user')
const images = require('./routes/images')

const app = express()
app.disable('x-powered-by')

// view engine setup
app.set('views', path.join(__dirname, 'views'))
app.set('view engine', 'jade')

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')))
app.use(logger('combined'))
app.use(bodyParser.json({limit: '10mb'}))
app.use(bodyParser.urlencoded({limit: '10mb', extended: false }))
//app.use(cookieParser())
app.use(stylus.middleware({
  src: path.join(__dirname, 'public')
, compile(str, path) {
    return stylus(str)
      .use(autoprefixer({browsers: ['> 1%']}))
      .set('filename', path) // @import
      .set('compress', true) // compress
      .set('include css', true)
  }
}))
app.use(express.static(path.join(__dirname, 'public')))

app.use(passport.initialize())

app.use('/', routes)
app.use('/post', post)
app.use('/posts', posts)
app.use('/users', users)
app.use('/user', user)
app.use('/images', images)

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found')
  err.status = 404
  next(err)
})

// error handlers

// development error handler
// will print stacktrace
//if (app.get('env') === 'development') {
//  app.use(function(err, req, res, next) {
//    res.status(err.status || 500)
//    res.render('error', {
//      message: err.message,
//      error: err
//    })
//  })
//}
//
//// production error handler
//// no stacktraces leaked to user
//app.use(function(err, req, res, next) {
//  res.status(err.status || 500)
//  res.render('error', {
//    message: err.message,
//    error: {}
//  })
//})

app.use(function(err, req, res, next) {
  if (err.status != 404)
    console.error(err)
  res.status(err.status || 500).end()
})

module.exports = app
