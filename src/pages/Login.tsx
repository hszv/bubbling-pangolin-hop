import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { UtensilsCrossed } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Auth } from '@supabase/auth-ui-react';
import { ThemeSupa } from '@supabase/auth-ui-shared';
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEffect } from "react";

const Login = () => {
  const { session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (session) {
      navigate('/dashboard');
    }
  }, [session, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="text-center">
          <Link to="/" className="inline-block mx-auto mb-4">
            <UtensilsCrossed className="h-8 w-8 text-primary" />
          </Link>
          <CardTitle className="text-2xl">Login</CardTitle>
          <CardDescription>
            Acesse seu painel para gerenciar seu cardápio.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Auth
            supabaseClient={supabase}
            appearance={{ theme: ThemeSupa }}
            providers={[]}
            theme="dark"
            view="sign_in"
            localization={{
              variables: {
                sign_in: {
                  email_label: 'Endereço de e-mail',
                  password_label: 'Sua senha',
                  email_input_placeholder: 'Seu endereço de e-mail',
                  password_input_placeholder: 'Sua senha',
                  button_label: 'Entrar',
                  social_provider_text: 'Entrar com {{provider}}',
                  link_text: 'Já tem uma conta? Entre',
                  forgotten_password_link_text: 'Esqueceu sua senha?',
                },
                forgotten_password: {
                    email_label: 'Endereço de e-mail',
                    email_input_placeholder: 'Seu endereço de e-mail',
                    button_label: 'Enviar instruções de recuperação',
                    link_text: 'Lembrou sua senha? Entre',
                }
              },
            }}
          />
           <div className="mt-4 text-center text-sm">
            Não tem uma conta?{" "}
            <Link to="/signup" className="underline">
              Cadastre-se
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;