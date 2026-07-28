import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

interface DemoUser {
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: DemoUser | null;
  loading: boolean;
  login: (email: string) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  login: () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<DemoUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("gatekeeper_user");

    if (saved) {
      setUser(JSON.parse(saved));
    }

    setLoading(false);
  }, []);

  const login = (email: string) => {
    const demoUser = {
      name: email.split("@")[0],
      email,
      role: "Administrator",
    };

    localStorage.setItem("gatekeeper_user", JSON.stringify(demoUser));

    setUser(demoUser);
  };

  const logout = () => {
    localStorage.removeItem("gatekeeper_user");
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
