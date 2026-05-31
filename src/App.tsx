import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { EventFeed } from './pages/EventFeed';
import { EventDetail } from './pages/EventDetail';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';

const App: React.FC = () => {
  return (
    <Router>
      <div className="app-wrapper">
        {/* Responsive, modern Navigation Header */}
        <Header />

        {/* Core Main Viewport Workspace */}
        <main className="main-content">
          <Routes>
            {/* User facing public routes */}
            <Route path="/" element={<EventFeed />} />
            <Route path="/event/:slug" element={<EventDetail />} />

            {/* Administrator control panel routes */}
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />

            {/* Catch-all redirect to public feed */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>

        {/* Sleek Community Footer */}
        <Footer />
      </div>
    </Router>
  );
};

export default App;
