const fetch = require('node-fetch')
const base64 = require('base-64')

const url = 'https://api.mailgun.net/v3/example.com/messages'
const key = 'key-382394201ac0a8a023d34e129124b2c7'
function sendEmail(email, subject, text, html){
  const data = {
    from: 'Example <noreply@example.com>'
  , to: email
  , subject
  , text
  , html: html || text
  }
  const dataString = Object.keys(data).map(k=>k+'='+encodeURIComponent(data[k])).join('&')
  return fetch(url, {
    method: 'POST'
  , headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    , 'Authorization': 'Basic ' + base64.encode('api:'+key)
    }
  , body: dataString
  }).then(res=>{
    if (res.ok){
      return res.json()
    }
    return res.text()
  }).then(json=>{
    console.log('result:', json)
    return json
  }).catch(err=>{
    console.error('Error', err)
  })
}

module.exports = {
  sendResetEmail(email, resetCode){
    const subject = 'Reset code for your account'
    const text = 'This is the reset code for your account: ' + resetCode
    return sendEmail(email, subject, text)
  }
}
