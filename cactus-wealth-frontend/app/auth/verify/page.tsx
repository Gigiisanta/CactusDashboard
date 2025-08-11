"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

function VerifyPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");
  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("Token de verificación no encontrado en la URL");
      return;
    }

    verifyEmail(token);
  }, [token]);

  const verifyEmail = async (token: string) => {
    try {
      const response = await fetch("/api/auth/verify-email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage("¡Tu email ha sido verificado exitosamente! Ya puedes iniciar sesión con tu cuenta.");
      } else {
        setStatus("error");
        setMessage(data.detail || "Error al verificar el email");
      }
    } catch (error) {
      setStatus("error");
      setMessage("Error de conexión. Inténtalo de nuevo más tarde.");
    }
  };

  const handleGoToLogin = () => {
    router.push("/auth/login?verified=true");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 text-4xl">🌵</div>
          <CardTitle className="text-2xl font-bold text-green-700">
            Cactus Wealth
          </CardTitle>
          <CardDescription>
            Verificación de Email
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {status === "loading" && (
            <div className="text-center space-y-4">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-green-600" />
              <p className="text-muted-foreground">
                Verificando tu email...
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="text-center space-y-4">
              <CheckCircle className="h-12 w-12 mx-auto text-green-600" />
              <Alert className="border-green-200 bg-green-50">
                <AlertDescription className="text-green-800">
                  {message}
                </AlertDescription>
              </Alert>
              <Button
                onClick={handleGoToLogin}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                Ir al Login
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="text-center space-y-4">
              <XCircle className="h-12 w-12 mx-auto text-red-600" />
              <Alert variant="destructive">
                <AlertDescription>{message}</AlertDescription>
              </Alert>
              <div className="space-y-2">
                <Button
                  onClick={() => router.push("/auth/register")}
                  variant="outline"
                  className="w-full"
                >
                  Volver al Registro
                </Button>
                <Button
                  onClick={() => router.push("/auth/login")}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Ir al Login
                </Button>
              </div>
            </div>
          )}

          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              ¿Necesitas ayuda?{" "}
              <Link
                href="/contact"
                className="text-green-600 hover:text-green-700 font-medium"
              >
                Contáctanos
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <Card className="w-full max-w-md">
          <CardContent className="text-center space-y-4">
            <Loader2 className="h-12 w-12 animate-spin mx-auto text-green-600" />
            <p className="text-muted-foreground">Cargando...</p>
          </CardContent>
        </Card>
      </div>
    }>
      <VerifyPageContent />
    </Suspense>
  );
}