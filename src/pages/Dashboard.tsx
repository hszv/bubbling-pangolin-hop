const Dashboard = () => {
  return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8">
      <h1 className="text-3xl font-bold tracking-tight mb-6">
        Bem-vindo ao seu Painel
      </h1>
      <div className="bg-card border rounded-lg p-8 text-center">
        <h2 className="text-xl font-semibold mb-2">Seu Cardápio Digital</h2>
        <p className="text-muted-foreground">
          Aqui você poderá criar, editar e gerenciar todos os aspectos do seu cardápio.
        </p>
        {/* Futuros componentes do dashboard virão aqui */}
      </div>
    </div>
  );
};

export default Dashboard;