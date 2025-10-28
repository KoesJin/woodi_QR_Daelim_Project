import {
  ApolloClient,
  ApolloLink,
  ApolloProvider,
  createHttpLink,
  InMemoryCache,
  split,
} from "@apollo/client";

import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { createClient } from "graphql-ws";
import { SERVER_URL, WS_URL } from "./env";

const isBrowser = typeof window !== "undefined";

const authLink = new ApolloLink((operation, forward) => {
  operation.setContext(({ headers }) => ({
    headers: {
      ...headers,
    },
  }));
  return forward(operation);
});

const link = {
  uri: SERVER_URL,
  headers: {},
};

const httpLink = createHttpLink(link);

const connectedConfig = {
  activeSocket: null,
  timeOut: null,
};

const wsLink = isBrowser
  ? new GraphQLWsLink(
      createClient({
        url: WS_URL,
        keepAlive: 10 * 1000,
        retryAttempts: Infinity,
        retryWait: () =>
          new Promise((resolve) => setTimeout(resolve, 3 * 1000)),
        shouldRetry: () => true,
        on: {
          connected: (socket) => {
            connectedConfig.activeSocket = socket;
          },
          ping: (received) => {
            if (!received) {
              connectedConfig.timeOut = setTimeout(() => {
                if (
                  connectedConfig.activeSocket.readyState === WebSocket.OPEN
                ) {
                  connectedConfig.activeSocket.close(4408, "Request Timeout");
                }
              }, 3 * 1000);
            }
          },
          pong: (received) => {
            if (received) {
              clearTimeout(timedOut);
            }
          },
        },
      })
    )
  : null;

const splitLink = wsLink
  ? split(
      ({ query }) => {
        const definition = getMainDefinition(query);
        return (
          definition.kind === "OperationDefinition" &&
          definition.operation === "subscription"
        );
      },
      wsLink,
      httpLink
    )
  : httpLink;

const links = isBrowser
  ? ApolloLink.from([authLink, splitLink])
  : ApolloLink.from([authLink, httpLink]);

export const client = new ApolloClient({
  ssrMode: !isBrowser,
  link: links,
  cache: new InMemoryCache(),
  defaultOptions: {
    watchQuery: {
      fetchPolicy: "network-only",
    },
    query: {
      fetchPolicy: "network-only",
      errorPolicy: "all",
    },
    mutate: {
      errorPolicy: "all",
    },
  },
});

export const ApolloClientProvider = ({ children }) => {
  return <ApolloProvider client={client}>{children}</ApolloProvider>;
};
