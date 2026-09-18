import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import MusicList from "./pages/MusicList.jsx";
import AlbumList from "./pages/AlbumList.jsx";
import SingleList from "./pages/SingleList.jsx";
import MusicDetail from "./pages/MusicDetail.jsx";
import MusicSearch from "./pages/MusicSearch.jsx";
import BlogNew from "./pages/BlogNew.jsx";
import BlogList from "./pages/BlogList.jsx";
import BlogDetail from './pages/BlogDetail.jsx';
import Tabs from "./components/Tabs.jsx";
import FloatingButton from './components/FloatingButton';


function App() {
  return (
    <BrowserRouter>
      <div>
        <Tabs />
        <Routes>
          <Route path="/" element={<Navigate to="/music" />} />
          <Route path="/music" element={<MusicList />} />
          <Route path="/music/:slug" element={<MusicDetail />} />
          <Route path="/music/album" element={<AlbumList />} />
          <Route path="/music/single" element={<SingleList />} />
          <Route path="/music/search" element={<MusicSearch />} />
          <Route path="/blog/new" element={<BlogNew />} />
          <Route path="/blog" element={<BlogList />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />
        </Routes>
        <FloatingButton />
      </div>
    </BrowserRouter>
  );
}

export default App;
