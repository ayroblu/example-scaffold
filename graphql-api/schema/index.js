import {
  GraphQLSchema
, GraphQLObjectType
, GraphQLString
, GraphQLInt
, GraphQLList
} from 'graphql'

import {PersonType, PersonInputType} from './PersonType'

const QueryType = new GraphQLObjectType({
  name: 'Query'
, description: 'This is a query'
, fields: ()=>({
    person: {
      type: PersonType
    , description: 'Get yourself a person'
    , args: {
        id: {type: GraphQLInt}
      , firstName: {type: GraphQLString}
      }
    , resolve: (root, person, {loaders}, ast)=>{
        console.log('root', root, JSON.stringify(
          ast.fieldASTs.map(
            f=>f.selectionSet.selections.map(s=>s.name.value)), null, 2))
        return loaders.person.load(person)
      }
    }
  })
})
const MutationType = new GraphQLObjectType({
  name: 'Mutation'
, description: 'This is a mutation'
, fields: ()=>({
    createPerson: {
      type: PersonType
    , description: 'Creates a person'
    , args: {
        firstName: {type: GraphQLString}
      , name: {type: GraphQLString}
      , friends: {type: new GraphQLList(PersonInputType)}
      }
    , resolve: (root, person, {mutators}, ast)=>{
        return mutators.person.create(person)
      }
    }
  })
})

export default new GraphQLSchema({
  query: QueryType
, mutation: MutationType
})
