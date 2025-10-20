import { FeatureGuard } from "@/components/FeatureGuard";

const Coupons = () => {
  return (
    <FeatureGuard requiredPlan="Profissional" featureName="Gerenciar Cupons">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-6">
          Gerenciar Cupons
        </h1>
        <div className="bg-card border rounded-lg p-8 text-center">
          <p className="text-muted-foreground">
            Crie e gerencie cupons de desconto aqui.
          </p>
        </div>
      </div>
    </FeatureGuard>
  );
};

export default Coupons;