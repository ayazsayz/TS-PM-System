import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { useAuthStore } from './store/useAuthStore';
import { ToastHost } from './components/ToastHost';

export default function App() {
  const restore = useAuthStore((s) => s.restore);

  // Restore session before rendering routes.
  useEffect(() => {
    void restore();
    document.title = 'Super Admin Portal';
  }, [restore]);

  return (
    <>
      <RouterProvider router={router} />
      <ToastHost />
    </>
  );
}
