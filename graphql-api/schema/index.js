import {
  GraphQLSchema
, GraphQLObjectType
, GraphQLString
, GraphQLInt
, GraphQLList
} from 'graphql'

import PersonType from './PersonType'

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

export default new GraphQLSchema({
  query: QueryType
})
