import { FeatureGuard } from "@/components/FeatureGuard";
import { ResponsesForm } from "@/components/dashboard/bot/ResponsesForm";

const Bot = () => {
  return (
    <FeatureGuard requiredPlan="Premium" featureName="Assistente Virtual">
      <div>
        <div className="mb-6">
          <h1 className="text-3xl font-bold tracking-tight">Assistente Virtual</h1>
          <p className="text-muted-foreground mt-1">
            Personalize as mensagens automáticas que seu assistente enviará aos clientes no WhatsApp.
          </p>
        </div>
        <ResponsesForm />
      </div>
    </FeatureGuard>
  );
};

export default Bot;