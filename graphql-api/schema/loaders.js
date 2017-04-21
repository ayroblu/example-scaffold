import DataLoader from 'dataloader'

const db = [{
  id: 0
, first_name: 'First'
, name: 'James Freid'
, friends: [{id: 1}]
},{
  id: 1
, first_name: 'Second'
, name: 'Alex Defis'
, friends: [{id: 0}]
}]

const personLoader = new DataLoader(people=>{
  //db.filter(d=>friends.map(f=>f.id).includes(d.id))
  // must? return a promise
  return Promise.resolve(
    people.map(({id, firstName})=>db.find(d=>d.id===id || d.first_name===firstName)))
})
const loaders = {
  person: personLoader
}
export default loaders
