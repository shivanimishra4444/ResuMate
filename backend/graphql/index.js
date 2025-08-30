const { ApolloServer } = require('apollo-server-express');
const typeDefs = require('./schema/typeDefs');
const resolvers = require('./schema/resolvers');

const setupGraphQL = async (app) => {
  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => ({
      // Add any context like authentication here
    })
  });

  await server.start();
  server.applyMiddleware({ app, path: '/graphql' });
};

module.exports = setupGraphQL;
