import { FeatureGuard } from "@/components/FeatureGuard";

const Orders = () => {
  return (
    <FeatureGuard requiredPlan="Premium" featureName="Gerenciar Pedidos">
      <div>
        <h1 className="text-3xl font-bold tracking-tight mb-6">
          Gerenciar Pedidos
        </h1>
        <div className="bg-card border rounded-lg p-8 text-center">
          <p className="text-muted-foreground">
            Visualize e gerencie os pedidos recebidos aqui.
          </p>
        </div>
      </div>
    </FeatureGuard>
  );
};

export default Orders;