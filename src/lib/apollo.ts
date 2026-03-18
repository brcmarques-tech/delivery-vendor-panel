import { ApolloClient, InMemoryCache, createHttpLink, split } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { GraphQLWsLink } from '@apollo/client/link/subscriptions';
import { getMainDefinition } from '@apollo/client/utilities';
import { createClient } from 'graphql-ws';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/graphql';
const WS_URL = API_URL.replace(/^http/, 'ws');

const httpLink = createHttpLink({
  uri: API_URL,
});

const authLink = setContext((_, { headers }) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const wsLink = typeof window !== 'undefined'
  ? new GraphQLWsLink(
      createClient({
        url: WS_URL,
        connectionParams: () => {
          const token = localStorage.getItem('token');
          return { authorization: token ? `Bearer ${token}` : '' };
        },
      }),
    )
  : null;

const errorLink = onError(({ graphQLErrors }) => {
  if (typeof window === 'undefined') return;
  const sessionExpired = graphQLErrors?.some(
    (e) => e.message?.includes('SESSION_EXPIRED') || e.extensions?.code === 'UNAUTHENTICATED'
  );
  if (sessionExpired && localStorage.getItem('token')) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    alert('Sua conta foi conectada em outro dispositivo. Você foi desconectado.');
    window.location.href = '/';
  }
});

const splitLink = wsLink
  ? split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === 'OperationDefinition' &&
          definition.operation === 'subscription'
        );
      },
      wsLink,
      authLink.concat(httpLink),
    )
  : authLink.concat(httpLink);

export const apolloClient = new ApolloClient({
  link: errorLink.concat(splitLink),
  cache: new InMemoryCache(),
});
