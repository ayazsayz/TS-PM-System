import { useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { router } from './router';
import { useAuthStore } from './store/useAuthStore';

export default function App() {
  const restore = useAuthStore((s) => s.restore);

  // Restore the session from a persisted token before rendering routes.
  useEffect(() => {
    void restore();
  }, [restore]);

  return <RouterProvider router={router} />;
}
