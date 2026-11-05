import { useEffect, useState } from "react";
import { apiFetch, getToken, setToken } from "../lib/api.js";
import { AuthContext } from "./useAuth.js";

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  // true until we know whether the saved token still works
  const [loading, setLoading] = useState(Boolean(getToken()));

  useEffect(() => {
    if (getToken()) {
      apiFetch("/api/v1/auth/me")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => setUser(data ? data.user : null))
        .catch((err) => console.error("Error restoring session:", err))
        .finally(() => setLoading(false));
    }

    const handleLogout = () => setUser(null);
    window.addEventListener("auth:logout", handleLogout);
    return () => window.removeEventListener("auth:logout", handleLogout);
  }, []);

  // path: "login" or "register", throws an Error with the message of the server
  const authenticate = async (path, body) => {
    const res = await apiFetch(`/api/v1/auth/${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Something went wrong.");
    }
    setToken(data.token);
    setUser(data.user);
  };

  const value = {
    user,
    loading,
    login: (login, password) => authenticate("login", { login, password }),
    register: (username, email, password) => authenticate("register", { username, email, password }),
    logout: () => {
      setToken(null);
      setUser(null);
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
