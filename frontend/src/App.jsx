import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Home from './pages/Home';
import Auth from './pages/Auth';
import MovieDetail from './pages/MovieDetail';
import Profile from './pages/Profile';
import Lists from './pages/Lists';
import ListDetail from './pages/ListDetail';
import ReviewDetail from './pages/ReviewDetail';
import SearchResults from './pages/SearchResults';
import PersonDetail from './pages/PersonDetail';
import Diary from './pages/Diary';
import Feed from './pages/Feed';
import Admin from './pages/Admin';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Auth />} />
          <Route path="/register" element={<Auth />} />
          <Route path="/movies/:id" element={<MovieDetail />} />
          <Route path="/users/:username" element={<Profile />} />
          <Route path="/lists" element={<Lists />} />
          <Route path="/lists/:id" element={<ListDetail />} />
          <Route path="/reviews/:id" element={<ReviewDetail />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/people/:id" element={<PersonDetail />} />
          <Route path="/diary/:username" element={<Diary />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
