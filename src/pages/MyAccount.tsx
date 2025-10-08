import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useTenantAccess } from '@/hooks/useTenantAccess';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Loader2, User, Lock, LogOut, AlertCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

export default function MyAccount() {
  const { user, session } = useAuth();
  const { tenantSlug, tenantName, isLoading: tenantLoading } = useTenantAccess();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Validar contraseña
  const validatePassword = (): boolean => {
    setPasswordError('');

    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordError('Todos los campos son obligatorios');
      return false;
    }

    if (newPassword.length < 8) {
      setPasswordError('La nueva contraseña debe tener al menos 8 caracteres');
      return false;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Las contraseñas no coinciden');
      return false;
    }

    return true;
  };

  // Cambiar contraseña
  const handleChangePassword = async () => {
    if (!validatePassword()) return;

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        throw error;
      }

      toast({
        title: 'Contraseña actualizada',
        description: 'Tu contraseña ha sido cambiada exitosamente',
      });

      // Limpiar formulario
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setPasswordError('');
    } catch (error: any) {
      toast({
        title: 'Error al cambiar contraseña',
        description: error.message || 'No se pudo cambiar la contraseña',
        variant: 'destructive',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Cerrar todas las sesiones
  const handleSignOutAll = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        throw error;
      }

      toast({
        title: 'Sesiones cerradas',
        description: 'Has cerrado sesión en todos los dispositivos',
      });

      navigate('/login');
    } catch (error: any) {
      toast({
        title: 'Error al cerrar sesión',
        description: error.message || 'No se pudo cerrar la sesión',
        variant: 'destructive',
      });
    }
  };

  if (tenantLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No se pudo cargar la información del usuario</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-4xl space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Mi Cuenta</h1>
        <p className="text-muted-foreground">Gestiona tu información personal y configuración de seguridad</p>
      </div>

      {/* Información del usuario */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Información Personal
          </CardTitle>
          <CardDescription>Detalles de tu cuenta y empresa asignada</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label className="text-muted-foreground">Email</Label>
            <div className="text-lg font-medium">{user.email}</div>
          </div>
          
          {tenantName && (
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Empresa</Label>
              <div className="text-lg font-medium">{tenantName}</div>
            </div>
          )}

          {tenantSlug && (
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Código de empresa</Label>
              <div className="font-mono text-sm bg-muted px-3 py-2 rounded-md">{tenantSlug}</div>
            </div>
          )}

          {session?.user?.created_at && (
            <div className="grid gap-2">
              <Label className="text-muted-foreground">Cuenta creada</Label>
              <div className="text-sm">
                {new Date(session.user.created_at).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cambiar contraseña */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Cambiar Contraseña
          </CardTitle>
          <CardDescription>Actualiza tu contraseña para mantener tu cuenta segura</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {passwordError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{passwordError}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="current-password">Contraseña actual</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              disabled={isChangingPassword}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="new-password">Nueva contraseña</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isChangingPassword}
            />
            <p className="text-xs text-muted-foreground">Mínimo 8 caracteres</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirmar nueva contraseña</Label>
            <Input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              disabled={isChangingPassword}
            />
          </div>

          <Button
            onClick={handleChangePassword}
            disabled={isChangingPassword}
            className="w-full sm:w-auto"
          >
            {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Cambiar contraseña
          </Button>
        </CardContent>
      </Card>

      {/* Cerrar sesiones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LogOut className="h-5 w-5" />
            Seguridad de la Sesión
          </CardTitle>
          <CardDescription>Cierra sesión en todos los dispositivos para asegurar tu cuenta</CardDescription>
        </CardHeader>
        <CardContent>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="destructive" className="w-full sm:w-auto">
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar todas las sesiones
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>¿Cerrar todas las sesiones?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta acción cerrará tu sesión en todos los dispositivos y navegadores. 
                  Tendrás que volver a iniciar sesión.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={handleSignOutAll} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                  Cerrar sesiones
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  );
}
