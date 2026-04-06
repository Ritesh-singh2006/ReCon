import './App.css'
import Home from './pages/Home.jsx'
import Reader from './pages/Reader.jsx'
import { createBrowserRouter, RouterProvider } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Home />
  },
  {
    path: "/reader/:documentId",
    element: <Reader />
  }
])

export default function App() {
  return <RouterProvider router={router} />;
}