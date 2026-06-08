import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { LoginPage } from '../features/auth/pages';

const router = createBrowserRouter([
  {
    path: '/',
    element: <LoginPage />,
  },
  {
    path: '/login',
    element: <LoginPage />,
  },
  {
    path: '/fichajes',
    element: <div className="container mt-5"><h3>Pantalla de Fichajes (Próximamente)</h3></div>,
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  }
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;