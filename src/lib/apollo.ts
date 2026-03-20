import { ApolloClient, InMemoryCache, createHttpLink, split } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { RetryLink } from '@apollo/client/link/retry'; // M9: RetryLink for network resilience
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

const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (typeof window === 'undefined') return;
  const sessionExpired = graphQLErrors?.some(
    (e) => e.message?.includes('SESSION_EXPIRED') || e.extensions?.code === 'UNAUTHENTICATED'
  );
  if (sessionExpired && localStorage.getItem('token')) {
    // Silent logout — the subscription handles the user-facing alert
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
    return;
  }

  // L3: Generic error toast for unhandled GraphQL errors
  if (graphQLErrors) {
    for (const err of graphQLErrors) {
      if (!err.message?.includes('SESSION_EXPIRED') && err.extensions?.code !== 'UNAUTHENTICATED') {
        console.error(`[GraphQL Error]: ${err.message}`);
        // Show a toast notification if a global toast handler is available
        if (typeof window !== 'undefined' && (window as any).__apolloErrorToast) {
          (window as any).__apolloErrorToast(err.message);
        }
      }
    }
  }

  // L3: Log network errors
  if (networkError) {
    console.error(`[Network Error]: ${networkError.message}`);
  }
});

// M9: RetryLink for automatic retry on network failures
const retryLink = new RetryLink({
  delay: {
    initial: 300,
    max: 5000,
    jitter: true,
  },
  attempts: {
    max: 3,
    retryIf: (error) => !!error,
  },
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
  link: errorLink.concat(retryLink).concat(splitLink),
  cache: new InMemoryCache(),
});
