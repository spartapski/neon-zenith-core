import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

// Configurable authentication. Replace this array with a real backend later.
// Each entry defines credentials + role. The role drives RBAC across the Back Office.
export type Role = "super_admin" | "admin" | "commercial" | "designer";

export interface AuthUser {
  username: string;
  displayName: string;
  role: Role;
  email?: string;
}

interface StoredCredential extends AuthUser {
  password: string;
}

export const AUTH_CREDENTIALS: StoredCredential[] = [
  {
    username: "DRISS",
    password: "DRISS",
    displayName: "Driss — Super Admin",
    role: "super_admin",
    email: "driss@dodricom.com",
  },
];

// Module keys used by the sidebar / route guards.
export type ModuleKey =
  | "dashboard"
  | "administration"
  | "cms"
  | "crm"
  | "finance"
  | "billing"
  | "saas"
  | "messages"
  | "settings";

export const ROLE_PERMISSIONS: Record<Role, ModuleKey[]> = {
  super_admin: [
    "dashboard",
    "administration",
    "cms",
    "crm",
    "finance",
    "billing",
    "saas",
    "messages",
    "settings",
  ],
  admin: [
    "dashboard",
    "administration",
    "cms",
    "crm",
    "billing",
    "saas",
    "messages",
    "settings",
  ],
  commercial: ["dashboard", "crm", "billing", "messages"],
  designer: ["dashboard", "cms", "messages"],
};

interface AuthContextValue {
  user: AuthUser | null;
  ready: boolean;
  login: (username: string, password: string, remember: boolean) => { ok: true } | { ok: false; error: string };
  logout: () => void;
  can: (module: ModuleKey) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);
const STORAGE_KEY = "dodricom_auth_user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw =
        localStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw) as AuthUser);
    } catch {
      // ignore
    }
    setReady(true);
  }, []);

  const login: AuthContextValue["login"] = (username, password, remember) => {
    const match = AUTH_CREDENTIALS.find(
      (c) =>
        c.username.toLowerCase() === username.trim().toLowerCase() &&
        c.password === password,
    );
    if (!match) return { ok: false, error: "Identifiants invalides." };
    const safe: AuthUser = {
      username: match.username,
      displayName: match.displayName,
      role: match.role,
      email: match.email,
    };
    setUser(safe);
    try {
      const store = remember ? localStorage : sessionStorage;
      store.setItem(STORAGE_KEY, JSON.stringify(safe));
      (remember ? sessionStorage : localStorage).removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    return { ok: true };
  };

  const logout = () => {
    setUser(null);
    try {
      localStorage.removeItem(STORAGE_KEY);
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const can: AuthContextValue["can"] = (m) =>
    !!user && ROLE_PERMISSIONS[user.role].includes(m);

  return (
    <AuthContext.Provider value={{ user, ready, login, logout, can }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}