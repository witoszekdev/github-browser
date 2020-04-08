import React, { useEffect, useReducer } from "react";
import { Router } from "@reach/router";
import ApolloClient from "apollo-boost";
import { ApolloProvider } from "@apollo/react-hooks";
import firebase from "firebase/app";
import "firebase/auth";

import Login from "./pages/Login";
import Browse from "./pages/Browse";

const apolloConfig = {
  uri: "https://api.github.com/graphql",
};

function getInitialState() {
  const token = localStorage.getItem("githubToken");

  if (token) {
    const apolloClient = new ApolloClient({
      ...apolloConfig,
      headers: {
        ...apolloConfig?.headers,
        Authorization: `bearer ${token}`,
      },
    });
    return { user: null, apolloClient, loading: false };
  }
  return { user: null, apolloClient: null, loading: true };
}

function reducer(state, action) {
  switch (action.type) {
    case "LOGIN":
      if (state.apolloClient) {
        return {
          ...state,
          user: action.payload.user,
        };
      } else {
        return {
          ...state,
          user: action.payload.user,
          apolloClient: new ApolloClient({
            ...apolloConfig,
            headers: {
              ...apolloConfig?.headers,
              Authorization: `bearer ${action.payload.token}`,
            },
          }),
        };
      }
    case "LOGOUT":
      return { ...state, user: null, apolloClient: null };
    case "FINISH_LOADING":
      return { ...state, loading: true };
    case "END_LOADING":
      return { ...state, loading: false };
    default:
      throw new Error();
  }
}

function App() {
  const [state, dispatch] = useReducer(reducer, {}, getInitialState);

  // Listen for auth changes
  useEffect(() => {
    return firebase.auth().onAuthStateChanged((user) => {
      if (user) {
        const token = localStorage.getItem("githubToken");
        dispatch({ type: "LOGIN", payload: { user, token } });
      } else {
        dispatch({ type: "LOGOUT" });
        if (localStorage.getItem("githubToken")) {
          localStorage.removeItem("githubToken");
        }
      }
      dispatch({ type: "END_LOADING" });
    });
  }, []);

  if (!state.apolloClient) {
    return <Login />;
  }

  return (
    <ApolloProvider client={state.apolloClient}>
      <Router>
        <Browse path="/" />
      </Router>
    </ApolloProvider>
  );
}

export default App;
