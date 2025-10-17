import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthContextType {
  isAuthenticated: boolean;
  login: (email: string) => void;
  logout: () => void;
  user: User | null;
  session: Session | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Obtener sesión existente primero (antes de configurar listener)
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        console.error("Error al obtener sesión:", error);
      }

      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session);
      setIsLoading(false);
    });

    // Configurar UN ÚNICO listener de cambios de autenticación
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state change:", event);

      setSession(session);
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session);
      setIsLoading(false);

      // Manejo específico de eventos
      if (event === "SIGNED_OUT") {
        // Limpiar cualquier dato en caché si es necesario
        console.log("Usuario cerró sesión");
      } else if (event === "TOKEN_REFRESHED") {
        console.log("Token refrescado exitosamente");
      } else if (event === "SIGNED_IN") {
        console.log("Usuario inició sesión");
      }
    });

    // Cleanup: desuscribir cuando el componente se desmonte
    return () => {
      subscription.unsubscribe();
    };
  }, []); // Array vacío: solo se ejecuta una vez al montar

  const login = (email: string) => {
    // Este método se mantiene por compatibilidad pero el login real se hace en Login component
    console.warn("Use Supabase auth methods directly instead of this login function");
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error al cerrar sesión:", error);
        throw error;
      }
    } catch (error) {
      console.error("Error en logout:", error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, user, session, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
