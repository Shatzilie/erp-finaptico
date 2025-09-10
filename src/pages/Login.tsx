import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { Building2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setIsLoading(true);
    
    try {
      let result;
      
      if (isSignUp) {
        const redirectUrl = `${window.location.origin}/`;
        result = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl
          }
        });
      } else {
        result = await supabase.auth.signInWithPassword({
          email,
          password
        });
      }

      const { data, error } = result;
      
      if (error) {
        toast({
          title: "Error de autenticación",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (isSignUp) {
        toast({
          title: "Registro exitoso",
          description: "Revisa tu email para confirmar tu cuenta",
        });
        return;
      }

      // Tras login, descubre su tenant y redirige
      if (data.user) {
        // Use direct fetch instead of typed client due to type issues
        const profileResponse = await fetch(
          `https://dtmrywilxpilpzokxxif.supabase.co/rest/v1/profiles?user_id=eq.${data.user.id}&select=tenant_id`,
          {
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0bXJ5d2lseHBpbHB6b2t4eGlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MTQ3NDcsImV4cCI6MjA3MzA5MDc0N30.2oV-SA1DS-nM72udb-I_IGYM1vIRxRp66np3N_ZVYbY',
              'Authorization': `Bearer ${data.session?.access_token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const profiles = await profileResponse.json();
        
        if (!profiles || profiles.length === 0) {
          toast({
            title: "Error",
            description: "Perfil sin tenant asignado",
            variant: "destructive",
          });
          return;
        }

        const tenantResponse = await fetch(
          `https://dtmrywilxpilpzokxxif.supabase.co/rest/v1/tenants?id=eq.${profiles[0].tenant_id}&select=slug`,
          {
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR0bXJ5d2lseHBpbHB6b2t4eGlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc1MTQ3NDcsImV4cCI6MjA3MzA5MDc0N30.2oV-SA1DS-nM72udb-I_IGYM1vIRxRp66np3N_ZVYbY',
              'Authorization': `Bearer ${data.session?.access_token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        const tenants = await tenantResponse.json();
          
        if (tenants && tenants.length > 0 && tenants[0].slug) {
          navigate(`/${tenants[0].slug}/dashboard`, { replace: true });
        } else {
          toast({
            title: "Error",
            description: "Tenant no encontrado",
            variant: "destructive",
          });
        }
      }
    } catch (err) {
      toast({
        title: "Error",
        description: "Error de conexión",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-elevated">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-12 h-12 bg-gradient-primary rounded-xl flex items-center justify-center">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold">Portal Financiero</CardTitle>
            <CardDescription className="text-base">
              Accede a tu dashboard empresarial
            </CardDescription>
          </div>
        </CardHeader>
        
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login" onClick={() => setIsSignUp(false)}>
                Iniciar Sesión
              </TabsTrigger>
              <TabsTrigger value="signup" onClick={() => setIsSignUp(true)}>
                Registrarse
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="login" className="space-y-4 mt-6">
              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium">
                    Correo electrónico
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Contraseña
                  </Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Tu contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-primary hover:opacity-90 transition-opacity"
                  disabled={isLoading || !email.trim() || !password.trim()}
                >
                  {isLoading ? 'Entrando...' : 'Iniciar Sesión'}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4 mt-6">
              <form onSubmit={handleAuth} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-sm font-medium">
                    Correo electrónico
                  </Label>
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="tu@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signup-password" className="text-sm font-medium">
                    Contraseña
                  </Label>
                  <Input
                    id="signup-password"
                    type="password"
                    placeholder="Mínimo 6 caracteres"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="h-11"
                    minLength={6}
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-gradient-primary hover:opacity-90 transition-opacity"
                  disabled={isLoading || !email.trim() || !password.trim()}
                >
                  {isLoading ? 'Registrando...' : 'Crear Cuenta'}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 pt-6 border-t border-border">
            <p className="text-xs text-muted-foreground text-center">
              Autenticación con Supabase
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}