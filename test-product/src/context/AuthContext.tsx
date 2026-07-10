import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { instance } from "../api/axios";

interface AuthContextType {
  isAuthenticated: boolean;
  roles: string[];
  userId: number | null;
  phoneNumber: string | null;
  login: () => void; // appelée après un login réussi, juste pour rafraîchir l'état
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);
  const [userId, setUserId] = useState<number | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);

  function fetchMe() {
    instance
      .get("/api/me")
      .then((res) => {
        setIsAuthenticated(true);
        setRoles(res.data.roles);
        setUserId(res.data.id);
        setPhoneNumber(res.data.phoneNumber);
      })
      .catch(() => {
        setIsAuthenticated(false);
        setRoles([]);
        setUserId(null);
        setPhoneNumber(null);
      });
  }

  useEffect(() => {
    fetchMe(); // au chargement, on vérifie si le cookie est valide
  }, []);

  function login() {
    fetchMe();
  }

  function logout() {
    instance.post("/api/logout").finally(() => {
      setIsAuthenticated(false);
      setRoles([]);
      setUserId(null);
      setPhoneNumber(null);
    });
  }

  return (
    <AuthContext.Provider
      value={{ isAuthenticated, roles, userId, phoneNumber, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
