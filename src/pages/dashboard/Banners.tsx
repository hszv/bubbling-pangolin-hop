import { FeatureGuard } from "@/components/FeatureGuard";

const Banners = () => {
  return (
    <FeatureGuard requiredPlan="Profissional" featureName="Gerenciar Banners">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-6">
          Gerenciar Banners
        </h1>
        <div className="bg-card border rounded-lg p-8 text-center">
          <p className="text-muted-foreground">
            Adicione e gerencie banners promocionais aqui.
          </p>
        </div>
      </div>
    </FeatureGuard>
  );
};

export default Banners;