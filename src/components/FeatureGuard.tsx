import { useAuth } from "@/contexts/AuthContext";
import { Lock } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";

type Plan = "Básico" | "Profissional" | "Premium";

interface FeatureGuardProps {
  children: React.ReactNode;
  requiredPlan: Plan;
  featureName: string;
}

const planLevels: Record<Plan, number> = {
  "Básico": 1,
  "Profissional": 2,
  "Premium": 3,
};

export const FeatureGuard = ({ children, requiredPlan, featureName }: FeatureGuardProps) => {
  const { profile } = useAuth();

  if (!profile) {
    // Pode mostrar um loader ou nada enquanto o perfil carrega
    return null;
  }

  const userPlanLevel = planLevels[profile.plan as Plan] || 1;
  const requiredPlanLevel = planLevels[requiredPlan];

  if (userPlanLevel >= requiredPlanLevel) {
    return <>{children}</>;
  }

  return (
    <Card className="mt-6">
      <CardContent className="p-8 text-center">
        <Lock className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">Recurso Bloqueado: {featureName}</h2>
        <p className="text-muted-foreground mb-4">
          Esta funcionalidade está disponível apenas para assinantes do plano{" "}
          <strong>{requiredPlan}</strong> ou superior.
        </p>
        <Button>Fazer Upgrade do Plano</Button>
      </CardContent>
    </Card>
  );
};