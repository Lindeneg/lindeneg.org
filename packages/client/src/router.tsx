import { createBrowserRouter, Outlet } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout';
import { AuthProvider } from './contexts/AuthProvider';
import AuthGuard from './components/layout/AuthGuard';
import HomePage from './pages/public/HomePage';
import BlogPage from './pages/public/BlogPage';
import BlogPostPage from './pages/public/BlogPostPage';
import DynamicPage from './pages/public/DynamicPage';
import NotFound from './pages/public/NotFound';
import LoginPage from './pages/admin/LoginPage';
import DashboardPage from './pages/admin/DashboardPage';
import PagesEditor from './pages/admin/PagesEditor';
import NavEditor from './pages/admin/NavEditor';
import BlogEditor from './pages/admin/BlogEditor';
import MessagesPage from './pages/admin/MessagesPage';
import SettingsPage from './pages/admin/SettingsPage';

export const router = createBrowserRouter([
  {
    element: <PublicLayout />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/blog', element: <BlogPage /> },
      { path: '/blog/:slug', element: <BlogPostPage /> },
      { path: '/:slug', element: <DynamicPage /> },
    ],
  },
  {
    path: '/admin',
    element: <AuthProvider><Outlet /></AuthProvider>,
    children: [
      { path: 'login', element: <LoginPage /> },
      {
        element: <AuthGuard />,
        children: [
          { index: true, element: <DashboardPage /> },
          { path: 'pages', element: <PagesEditor /> },
          { path: 'navigation', element: <NavEditor /> },
          { path: 'blog', element: <BlogEditor /> },
          { path: 'messages', element: <MessagesPage /> },
          { path: 'settings', element: <SettingsPage /> },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
]);
