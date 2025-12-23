import { GraphQLClient } from 'graphql-request';

const endpoint = process.env.NEXT_PUBLIC_HASURA_ENDPOINT || 'http://localhost:8080/v1/graphql';

export const graphqlClient = new GraphQLClient(endpoint, {
  headers: {
    'content-type': 'application/json',
  },
});

export const graphqlClientWithAuth = (token?: string) => {
  return new GraphQLClient(endpoint, {
    headers: {
      'content-type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
  });
};
