import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { instance } from "../api/axios";

interface AuthContextType {
  token: string | null;
  roles: string[];
  userId: number | null;
  phoneNumber: string | null;
  login: (token: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token"),
  );

  const [roles, setRoles] = useState<string[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      setRoles([]);
      setUserId(null);
      setPhoneNumber(null);
      return;
    }

    instance
      .get<{
        id: number;
        roles: string[];
        phoneNumber: string | null;
      }>("/api/me")
      .then((res) => {
        setRoles(res.data.roles);
        setUserId(res.data.id);
        setPhoneNumber(res.data.phoneNumber);
      })
      .catch(() => {
        setRoles([]);
        setUserId(null);
        setPhoneNumber(null);
      });
  }, [token]);

  function login(newToken: string) {
    localStorage.setItem("token", newToken);
    setToken(newToken);
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setRoles([]);
    setUserId(null);
    setPhoneNumber(null);
  }

  return (
    <AuthContext.Provider
      value={{
        token,
        roles,
        userId,
        phoneNumber,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
