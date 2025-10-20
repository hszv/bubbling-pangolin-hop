import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { UtensilsCrossed } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useState, FormEvent, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { showError, showSuccess } from "@/utils/toast";
import { useAuth } from "@/contexts/AuthContext";

const Signup = () => {
  const [restaurantName, setRestaurantName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [selectedPlan, setSelectedPlan] = useState('Básico');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { session } = useAuth();

  useEffect(() => {
    if (session) {
      navigate('/dashboard');
    }
  }, [session, navigate]);

  const handleSignup = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          restaurant_name: restaurantName,
          plan: selectedPlan,
        },
      },
    });

    setLoading(false);
    if (error) {
      showError(error.message);
    } else {
      showSuccess("Cadastro realizado! Verifique seu e-mail para confirmar a conta.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="mx-auto max-w-sm w-full">
        <CardHeader className="text-center">
          <Link to="/" className="inline-block mx-auto mb-4">
            <UtensilsCrossed className="h-8 w-8 text-primary" />
          </Link>
          <CardTitle className="text-2xl">Criar Conta</CardTitle>
          <CardDescription>
            Comece a criar seu cardápio digital em segundos.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup}>
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="restaurant-name">Nome do Restaurante</Label>
                <Input 
                  id="restaurant-name" 
                  placeholder="Pizzaria do Sabor" 
                  required 
                  value={restaurantName}
                  onChange={(e) => setRestaurantName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="password">Senha</Label>
                <Input 
                  id="password" 
                  type="password" 
                  required 
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Escolha seu Plano</Label>
                <RadioGroup defaultValue="Básico" value={selectedPlan} onValueChange={setSelectedPlan}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Básico" id="r1" />
                    <Label htmlFor="r1">Básico</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Profissional" id="r2" />
                    <Label htmlFor="r2">Profissional</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="Premium" id="r3" />
                    <Label htmlFor="r3">Premium</Label>
                  </div>
                </RadioGroup>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Criando...' : 'Criar minha conta'}
              </Button>
            </div>
          </form>
          <div className="mt-4 text-center text-sm">
            Já tem uma conta?{" "}
            <Link to="/login" className="underline">
              Fazer Login
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Signup;