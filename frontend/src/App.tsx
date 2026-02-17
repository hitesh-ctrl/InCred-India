import { Link, Route, Routes, useLocation } from 'react-router-dom';
import LandingPage from './routes/LandingPage';
import ScorePage from './routes/ScorePage';
import DashboardPage from './routes/DashboardPage';
import ResponsibleAIPage from './routes/ResponsibleAIPage';

function Nav() {
  const location = useLocation();
  const linkClass = (path: string) =>
    `relative px-3 py-2 rounded-md text-sm font-medium transition-all duration-300 ${location.pathname === path
      ? 'text-primary bg-primary/5'
      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
    }`;

  return (
    <header className="sticky top-0 z-50 border-b border-white/20 bg-white/60 backdrop-blur-xl shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4">
        <div className="flex items-center gap-2 group cursor-pointer">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-vivid-600 text-white font-bold shadow-neon transform group-hover:scale-105 transition-transform duration-300">
            A
          </div>
          <div className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-700 tracking-tight">AltScore</div>
        </div>
        <nav className="flex gap-1">
          <Link to="/" className={linkClass('/')}>
            Overview
            {location.pathname === '/' && <span className="absolute bottom-0 left-0 h-0.5 w-full bg-primary rounded-full" />}
          </Link>
          <Link to="/score" className={linkClass('/score')}>
            Scoring Demo
            {location.pathname === '/score' && <span className="absolute bottom-0 left-0 h-0.5 w-full bg-primary rounded-full" />}
          </Link>
          <Link to="/dashboard" className={linkClass('/dashboard')}>
            Dashboard
            {location.pathname === '/dashboard' && <span className="absolute bottom-0 left-0 h-0.5 w-full bg-primary rounded-full" />}
          </Link>
          <Link to="/responsible-ai" className={linkClass('/responsible-ai')}>
            Responsible AI
            {location.pathname === '/responsible-ai' && <span className="absolute bottom-0 left-0 h-0.5 w-full bg-primary rounded-full" />}
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 relative selection:bg-purple-200 selection:text-purple-900 overflow-hidden">
      {/* Background glow effects */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-pink-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-blob animation-delay-4000"></div>
      </div>

      <Nav />
      <main className="flex-1 z-10 relative">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/score" element={<ScorePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/responsible-ai" element={<ResponsibleAIPage />} />
          </Routes>
        </div>
      </main>

      <footer className="py-6 text-center text-xs text-slate-400 z-10 relative">
        <p>© 2024 AltScore Fintech Demo. Synthetic data only.</p>
      </footer>
    </div>
  );
}
