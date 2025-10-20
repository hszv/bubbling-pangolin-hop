const Overview = () => {
  return (
    <div>
      <h1 className="text-3xl font-bold tracking-tight mb-6">
        Visão Geral
      </h1>
      <div className="bg-card border rounded-lg p-8 text-center">
        <h2 className="text-xl font-semibold mb-2">Bem-vindo ao seu Painel</h2>
        <p className="text-muted-foreground">
          Aqui você poderá gerenciar todos os aspectos do seu cardápio. Use a navegação à esquerda para começar.
        </p>
      </div>
    </div>
  );
};

export default Overview;