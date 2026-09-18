import { createContext, useContext } from "react";

export const AuthContext = createContext(null);

// { user, loading, login, register, logout }
export function useAuth() {
  return useContext(AuthContext);
}
