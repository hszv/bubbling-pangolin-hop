import { FeatureGuard } from "@/components/FeatureGuard";

const Reservations = () => {
  return (
    <FeatureGuard requiredPlan="Profissional" featureName="Gerenciar Reservas">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-6">
          Gerenciar Reservas
        </h1>
        <div className="bg-card border rounded-lg p-8 text-center">
          <p className="text-muted-foreground">
            Visualize e gerencie as reservas aqui.
          </p>
        </div>
      </div>
    </FeatureGuard>
  );
};

export default Reservations;