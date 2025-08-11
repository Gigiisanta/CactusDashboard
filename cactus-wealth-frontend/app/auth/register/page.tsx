"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, User, Mail, Lock, UserCheck } from "lucide-react";

interface Manager {
  id: number;
  name: string;
  email: string;
}

export default function RegisterPage() {
  const _router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [managers, setManagers] = useState<Manager[]>([]);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
    role: "ADVISOR",
    managerId: "",
  });

  // Cargar lista de managers cuando el rol es ADVISOR
  useEffect(() => {
    if (formData.role === "ADVISOR") {
      fetchManagers();
    }
  }, [formData.role]);

  const fetchManagers = async () => {
    try {
      const response = await fetch("/api/managers");
      if (response.ok) {
        const data = await response.json();
        setManagers(data);
      }
    } catch (error) {
      console.error("Error cargando managers:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Limpiar mensajes cuando el usuario empiece a escribir
    if (error) setError("");
    if (success) setSuccess("");
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError("");
    if (success) setSuccess("");
  };

  const validateForm = () => {
    if (!formData.name.trim()) {
      setError("El nombre es requerido");
      return false;
    }

    if (!formData.email.trim()) {
      setError("El email es requerido");
      return false;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Email inválido");
      return false;
    }

    if (!formData.username.trim()) {
      setError("El nombre de usuario es requerido");
      return false;
    }

    if (formData.username.length < 3) {
      setError("El nombre de usuario debe tener al menos 3 caracteres");
      return false;
    }

    if (!formData.password) {
      setError("La contraseña es requerida");
      return false;
    }

    if (formData.password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres");
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError("Las contraseñas no coinciden");
      return false;
    }

    if (formData.role === "ADVISOR" && !formData.managerId) {
      setError("Debes seleccionar un manager");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError("");
    setSuccess("");

    try {
      const payload = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        username: formData.username.trim().toLowerCase(),
        password: formData.password,
        confirmPassword: formData.confirmPassword,
        role: formData.role,
        managerId: formData.managerId ? parseInt(formData.managerId) : null,
      };

      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess(
          `¡Registro exitoso! Se ha enviado un email de verificación a ${formData.email}. Revisa tu bandeja de entrada y haz clic en el enlace para activar tu cuenta.`
        );
        // Limpiar formulario
        setFormData({
          name: "",
          email: "",
          username: "",
          password: "",
          confirmPassword: "",
          role: "ADVISOR",
          managerId: "",
        });
      } else {
        setError(data.detail || "Error en el registro");
      }
    } catch (error) {
      setError("Error de conexión. Inténtalo de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 text-4xl">🌵</div>
          <CardTitle className="text-2xl font-bold text-green-700">
            Cactus Wealth
          </CardTitle>
          <CardDescription>
            Crea tu cuenta para acceder al dashboard
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {success && (
            <Alert className="border-green-200 bg-green-50">
              <AlertDescription className="text-green-800">
                {success}
              </AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Nombre */}
            <div className="space-y-2">
              <Label htmlFor="name">Nombre Completo</Label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Tu nombre completo"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Username */}
            <div className="space-y-2">
              <Label htmlFor="username">Nombre de Usuario</Label>
              <div className="relative">
                <UserCheck className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="usuario_unico"
                  value={formData.username}
                  onChange={handleInputChange}
                  className="pl-10"
                  required
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Rol */}
            <div className="space-y-2">
              <Label htmlFor="role">Rol</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleSelectChange("role", value)}
                disabled={isLoading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tu rol" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ADVISOR">Advisor</SelectItem>
                  <SelectItem value="MANAGER">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Manager (solo para Advisors) */}
            {formData.role === "ADVISOR" && (
              <div className="space-y-2">
                <Label htmlFor="managerId">Manager Asignado</Label>
                <Select
                  value={formData.managerId}
                  onValueChange={(value) => handleSelectChange("managerId", value)}
                  disabled={isLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona tu manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {managers.map((manager) => (
                      <SelectItem key={manager.id} value={manager.id.toString()}>
                        {manager.name} ({manager.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Contraseña */}
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Mínimo 8 caracteres"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10 pr-10"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            {/* Confirmar Contraseña */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Repite tu contraseña"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="pl-10 pr-10"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-3 h-4 w-4 text-muted-foreground hover:text-foreground"
                  disabled={isLoading}
                >
                  {showConfirmPassword ? <EyeOff /> : <Eye />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-green-600 hover:bg-green-700"
              disabled={isLoading}
            >
              {isLoading ? "Registrando..." : "Crear Cuenta"}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              ¿Ya tienes una cuenta?{" "}
              <Link
                href="/auth/login"
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Inicia sesión aquí
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}