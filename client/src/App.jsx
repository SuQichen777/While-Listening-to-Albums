import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import AuthProvider from "./context/AuthProvider.jsx";
import { useAuth } from "./context/useAuth.js";
import MusicList from "./pages/MusicList.jsx";
import AlbumList from "./pages/AlbumList.jsx";
import SingleList from "./pages/SingleList.jsx";
import MusicDetail from "./pages/MusicDetail.jsx";
import MusicSearch from "./pages/MusicSearch.jsx";
import BlogNew from "./pages/BlogNew.jsx";
import BlogList from "./pages/BlogList.jsx";
import BlogDetail from './pages/BlogDetail.jsx';
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Header from "./components/Header.jsx";
import FloatingButton from './components/FloatingButton';
import ProtectedRoute from "./components/ProtectedRoute.jsx";

function Layout() {
  const { user } = useAuth();
  return (
    <div>
      <Header />
      <main className="l-main">
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate to="/music" />} />
          <Route path="/music" element={<MusicList />} />
          <Route path="/music/:slug" element={<MusicDetail />} />
          <Route path="/music/album" element={<AlbumList />} />
          <Route path="/music/single" element={<SingleList />} />
          <Route path="/music/search" element={<MusicSearch />} />
          <Route path="/blog/new" element={<BlogNew />} />
          <Route path="/blog" element={<BlogList />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
      </main>
      {user && <FloatingButton />}
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Layout />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
