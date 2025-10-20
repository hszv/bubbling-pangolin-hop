import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Check, Palette, QrCode, Edit, Star, LayoutTemplate, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { showError } from "@/utils/toast";

const Index = () => {
  const navigate = useNavigate();

  const features = [
    { icon: <Palette className="h-8 w-8 text-primary" />, title: "Personalização Completa", description: "Escolha layouts, cores e adicione seu logotipo para um cardápio com a cara do seu restaurante." },
    { icon: <Edit className="h-8 w-8 text-primary" />, title: "Edição em Tempo Real", description: "Interface intuitiva para editar pratos, preços e descrições a qualquer momento, de qualquer lugar." },
    { icon: <QrCode className="h-8 w-8 text-primary" />, title: "QR Code Exclusivo", description: "Gere um QR Code para seu cardápio e facilite o acesso dos clientes via celular, WhatsApp e redes sociais." },
    { icon: <LayoutTemplate className="h-8 w-8 text-primary" />, title: "Construtor Visual Drag & Drop", description: "Arraste e solte blocos para montar seu cardápio de forma visual e com pré-visualização instantânea." },
    { icon: <BarChart3 className="h-8 w-8 text-primary" />, title: "Dashboard Analítico", description: "Acompanhe picos de visualização, pratos mais clicados e a origem dos acessos em gráficos interativos." },
    { icon: <Star className="h-8 w-8 text-primary" />, title: "Avaliações de Clientes", description: "Colete e exiba avaliações de clientes diretamente no cardápio para aumentar a confiança e o engajamento." },
  ];

  const pricingPlans = [
    { name: "Básico", price: "R$ 29", features: ["Cardápio Digital", "QR Code Exclusivo", "Atualizações Ilimitadas", "Suporte por E-mail"], popular: false },
    { name: "Profissional", price: "R$ 59", features: ["Tudo do plano Básico", "Banners Promocionais", "Reservas Online", "Dashboard Analítico", "Integração com Avaliações", "Suporte Prioritário"], popular: true },
    { name: "Premium", price: "R$ 99", features: ["Tudo do plano Profissional", "Pedidos Online no Cardápio", "Domínio Personalizado", "Assistente Virtual (IA)", "Suporte VIP"], popular: false },
  ];

  const handleSubscription = async (planName: string) => {
    // !! AÇÃO NECESSÁRIA: Substitua pelos IDs de Preço do seu painel Stripe !!
    const priceIds = {
      "Profissional": "price_xxxxxxxxxxxxxx",
      "Premium": "price_yyyyyyyyyyyyyy",
    };

    const priceId = priceIds[planName];
    if (!priceId) {
      navigate('/signup');
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate('/signup');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { priceId },
      });
      if (error) throw error;
      window.location.href = data.url;
    } catch (error) {
      showError(`Erro ao iniciar assinatura: ${error.message}`);
    }
  };

  return (
    <div className="bg-background text-foreground">
      <Header />
      <main>
        <section className="text-center py-20 sm:py-32">
          <div className="container mx-auto px-4">
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">A Plataforma Inteligente para seu Cardápio Digital</h1>
            <p className="mt-4 max-w-2xl mx-auto text-lg text-muted-foreground">Crie, personalize e gerencie seu cardápio com um construtor visual, análises e ferramentas de engajamento.</p>
            <div className="mt-8"><Button size="lg" onClick={() => navigate('/signup')}>Crie seu Cardápio Grátis</Button></div>
          </div>
        </section>
        <section id="features" className="py-20 bg-muted">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-12">Recursos Poderosos para o seu Negócio</h2>
            <div className="grid md:grid-cols-3 gap-8">{features.map((feature, index) => (<Card key={index} className="text-center"><CardHeader><div className="mx-auto bg-primary/10 p-3 rounded-full w-fit">{feature.icon}</div><CardTitle className="mt-4">{feature.title}</CardTitle></CardHeader><CardContent><p className="text-muted-foreground">{feature.description}</p></CardContent></Card>))}</div>
          </div>
        </section>
        <section id="pricing" className="py-20">
          <div className="container mx-auto px-4">
            <h2 className="text-3xl font-bold text-center mb-4">Planos e Preços</h2>
            <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">Escolha o plano ideal para o seu restaurante e comece a transformar a experiência dos seus clientes hoje mesmo.</p>
            <div className="grid lg:grid-cols-3 gap-8 max-w-5xl mx-auto">{pricingPlans.map((plan) => (<Card key={plan.name} className={`flex flex-col ${plan.popular ? 'border-primary border-2' : ''}`}>{plan.popular && (<div className="bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider text-center py-1">Mais Popular</div>)}<CardHeader className="text-center"><CardTitle className="text-2xl">{plan.name}</CardTitle><CardDescription><span className="text-4xl font-bold">{plan.price}</span>/mês</CardDescription></CardHeader><CardContent className="flex-grow"><ul className="space-y-3">{plan.features.map((feature) => (<li key={feature} className="flex items-center"><Check className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" /><span className="text-muted-foreground">{feature}</span></li>))}</ul></CardContent><CardFooter><Button className="w-full" variant={plan.popular ? 'default' : 'outline'} onClick={() => handleSubscription(plan.name)}>Assinar {plan.name}</Button></CardFooter></Card>))}</div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Index;