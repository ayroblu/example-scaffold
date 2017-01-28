const fetch = require('node-fetch')

const url = 'https://fcm.googleapis.com/fcm/send'
const key = 'AAAA2xQkozI:APA91bHmQz0au1JEP-w6DQc9eoRLf0cQo0tJkMu_Mc_S_tzDpmZGcukQjyFuuFrDkVVYmMyXwaIfT_3RYdEda7adKsFIJKHIaDhOnpuLVmbBiLETd5vSb8yd6IHuhKhzITqD8agTnsYzjVDeJ2_JhUIgrqpCtzh23w'
function sendNotification(pushIds, payload){
  const data = {
    "notification": payload || {
      "title": "Test Notification"
    , "body": "Please enter proper data here"
    },
    //"to" : "ekLL4a26-0Q:APA91bHvkuS2ybKiSkqEw80SygKwbHJTOMwvFVovrJm3LFRf-hSpoJE0zrD1GEiIGq3zXqW-WVJAokD4dvkO-6_tZOPq9TgDx3YTTVnpuRfSRfDLkR38vam9rIdET-GNbFUXTk22UsKN"
    //to: 'fh9X-8m10ek:APA91bF-nOH7MZ3gnCe1xVnh-mqTCTNEZA1NnOhC-WbiY1Nc9rjkzTrvQH-6kxc4Vfc4JfakSO6Q6a8ITNtAvEToc_VX0YTdxut4vlpZewAbYkbd2hBdfjLjjXjCPy0vq8dgQnaCG-38'
    //to: pushId
    registration_ids: pushIds
  }
  return fetch(url, {
    method: 'POST'
  , headers: {
      'Accept': 'application/json'
    , 'Content-Type': 'application/json'
    , 'Authorization': 'key='+key
    }
  , body: JSON.stringify(data)
  }).then(res=>{
    if (res.ok){
      return res.json()
    }
    return res.text()
  }).then(json=>{
    //console.log('result:', json)
    return json
  }).catch(err=>{
    console.error('Error', err)
  })
}

module.exports = {
  sendFollowingNotification(pushIds, username){
    const payload = {
      title: 'New Follower!'
    , body: username + ' started following you!'
    }
    return sendNotification(pushIds, payload)
  }
, sendCommentedNotification(pushIds, username){
    const payload = {
      title: 'New comment'
    , body: username + ' commented on your post'
    }
    return sendNotification(pushIds, payload)
  }
}
