import React from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Layout } from './components/Layout';
import { Dashboard } from './views/Dashboard';
import { Empleados } from './views/Empleados';
import { Novedades } from './views/Novedades';
import { Liquidaciones } from './views/Liquidacion';
import { Portal } from './views/Portal';

const ViewRenderer: React.FC = () => {
  const { currentView } = useApp();

  switch (currentView) {
    case 'dashboard':
      return <Dashboard />;
    case 'empleados':
      return <Empleados />;
    case 'novedades':
      return <Novedades />;
    case 'liquidaciones':
      return <Liquidaciones />;
    case 'portal':
      return <Portal />;
    default:
      return <Dashboard />;
  }
};

function App() {
  return (
    <AppProvider>
      <Layout>
        <ViewRenderer />
      </Layout>
    </AppProvider>
  );
}

export default App;
