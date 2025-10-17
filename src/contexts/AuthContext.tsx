import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

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
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    console.log('🔐 AuthProvider: Inicializando...');
    
    let subscription: any = null;

    // Función async para controlar el orden
    const initAuth = async () => {
      try {
        // 1️⃣ Obtener sesión PRIMERO y esperar a que termine
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Error al obtener sesión:', error);
        }
        
        console.log('📦 Sesión inicial:', session ? 'EXISTE' : 'NO EXISTE');
        
        // Actualizar estados con la sesión inicial
        setSession(session);
        setUser(session?.user ?? null);
        setIsAuthenticated(!!session);
        setIsLoading(false);

        // 2️⃣ DESPUÉS configurar el listener
        const { data: authListener } = supabase.auth.onAuthStateChange(
          (event, session) => {
            console.log('🔄 Auth state change:', event);
            
            setSession(session);
            setUser(session?.user ?? null);
            setIsAuthenticated(!!session);

            if (event === 'SIGNED_OUT') {
              console.log('👋 Usuario cerró sesión');
            } else if (event === 'TOKEN_REFRESHED') {
              console.log('🔄 Token refrescado exitosamente');
            } else if (event === 'SIGNED_IN') {
              console.log('✅ Usuario inició sesión');
            }
          }
        );

        subscription = authListener.subscription;
      } catch (error) {
        console.error('❌ Error en initAuth:', error);
        setIsLoading(false);
      }
    };

    // Ejecutar la inicialización
    initAuth();

    // Cleanup
    return () => {
      if (subscription) {
        console.log('🧹 AuthProvider: Limpiando subscripción');
        subscription.unsubscribe();
      }
    };
  }, []);

  const login = (email: string) => {
    console.warn('⚠️ Use Supabase auth methods directly instead of this login function');
  };

  const logout = async () => {
    try {
      console.log('👋 Cerrando sesión...');
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('❌ Error al cerrar sesión:', error);
        throw error;
      }
    } catch (error) {
      console.error('❌ Error en logout:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      login, 
      logout, 
      user, 
      session, 
      isLoading 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

---

## 🎯 Cambios clave en esta versión:

1. **Función `async initAuth()`**: Envuelve toda la lógica de inicialización
2. **`await supabase.auth.getSession()`**: Bloquea hasta obtener la sesión
3. **Listener configurado DESPUÉS**: Solo después de procesar la sesión inicial
4. **`subscription` como variable local**: Para limpiar correctamente en el cleanup

---

## ✅ Qué deberías ver ahora en consola al hacer refresh:
```
🔐 AuthProvider: Inicializando...
📦 Sesión inicial: EXISTE  ← Primero esto
🔄 Auth state change: INITIAL_SESSION  ← Después el listener
🛡️ ProtectedRoute: { authLoading: false, isAuthenticated: true, ... }
✅ Acceso concedido