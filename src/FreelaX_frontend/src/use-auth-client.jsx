import { AuthClient } from "@dfinity/auth-client";
import React, { createContext, useContext, useEffect, useState } from "react";
import { FreelaX_backend } from "../../declarations/FreelaX_backend";
import { icrc1_ledger_canister } from "../../declarations/icrc1_ledger_canister";
import { icrc1_index_canister } from "../../declarations/icrc1_index_canister";
import { Actor } from "@dfinity/agent";

export const AuthContext = createContext({
  isAuthenticated: false,
  login: () => Promise.resolve(),
  logout: () => Promise.resolve(),
  identity: undefined,
  principal: undefined,
  currentUser: undefined,
  setCurrentUser: () => {},
});

export const useAuthClient = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [principal, setPrincipal] = useState(undefined);
  const [identity, setIdentity] = useState(undefined);
  const [currentUser, setCurrentUser] = useState(undefined);

  const authClientPromise = AuthClient.create();

  const login = async () => {
    const authClient = await authClientPromise;

    const internetIdentityUrl =
      process.env.DFX_NETWORK === "ic"
        ? "https //identity.ic0.app/#authorize"
        : `http://${process.env.CANISTER_ID_INTERNET_IDENTITY}.localhost:4943`;

    await new Promise((resolve) => {
      authClient.login({
        identityProvider: internetIdentityUrl,
        onSuccess: () => resolve(undefined),
      });
    });

    const identity = authClient.getIdentity();
    await updateIdentity(identity);
    setIsAuthenticated(true);
  };

  const logout = async () => {
    const authClient = await authClientPromise;
    await authClient.logout();
    const identity = authClient.getIdentity();
    await updateIdentity(identity);
    setIsAuthenticated(false);
  };

  const updateIdentity = async (identity) => {
    setIdentity(identity);
    setPrincipal(identity.getPrincipal());
    Actor.agentOf(FreelaX_backend)?.replaceIdentity(identity);
    Actor.agentOf(icrc1_ledger_canister)?.replaceIdentity(identity);
    Actor.agentOf(icrc1_index_canister)?.replaceIdentity(identity);
    const userProfile = await FreelaX_backend.myProfile();
    setCurrentUser(userProfile[0]);
  };

  const setInitialIdentity = async () => {
    try {
      const authClient = await AuthClient.create();
      const identity = authClient.getIdentity();
      await updateIdentity(identity);
      setIsAuthenticated(await authClient.isAuthenticated());
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    setInitialIdentity();
  }, []);

  return {
    isAuthenticated,
    login,
    logout,
    identity,
    principal,
    currentUser,
    setCurrentUser,
  };
};

export const AuthProvider = ({ children }) => {
  const auth = useAuthClient();

  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
