import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client/core'

const httpLink = createHttpLink({
  uri: 'http://localhost:3000/graphql',
})

const cache = new InMemoryCache()

export const apolloClient = new ApolloClient({
  link: httpLink,
  cache,
})

export default apolloClient
