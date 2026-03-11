"use client";

import { useEffect } from "react";
import { ApolloProvider } from "@apollo/client";
import { apolloClient } from "@/lib/apollo";

function useAntiSleep() {
  useEffect(() => {
    const interval = setInterval(() => {
      fetch("/api/health").catch(() => {});
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (apiUrl) {
        fetch(apiUrl.replace("/graphql", "/graphql?query={__typename}")).catch(() => {});
      }
    }, 14 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
}

export default function ApolloWrapper({ children }: { children: React.ReactNode }) {
  useAntiSleep();
  return <ApolloProvider client={apolloClient}>{children}</ApolloProvider>;
}
