import { Link, Route, Routes, useLocation } from 'react-router-dom';
import LandingPage from './routes/LandingPage';
import ScorePage from './routes/ScorePage';
import DashboardPage from './routes/DashboardPage';
import ResponsibleAIPage from './routes/ResponsibleAIPage';

function Logo() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="28" height="28" rx="7" fill="#0A6E5C" />
      <path d="M14 6L20 20H8L14 6Z" fill="white" fillOpacity="0.9" />
      <circle cx="14" cy="17" r="2.5" fill="#0A6E5C" />
    </svg>
  );
}

function Nav() {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Overview' },
    { path: '/score', label: 'Scoring Demo' },
    { path: '/dashboard', label: 'Dashboard' },
    { path: '/responsible-ai', label: 'Responsible AI' },
  ];

  return (
    <header className="sticky top-0 z-50 border-b border-surface-border bg-surface/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 h-16">
        <Link to="/" className="flex items-center gap-2.5 group" aria-label="AltScore Home">
          <Logo />
          <span className="text-lg font-bold text-ink tracking-tight">AltScore</span>
        </Link>
        <nav className="flex items-center gap-1" aria-label="Main navigation">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`relative px-3.5 py-2 rounded-lg text-sm font-medium transition-colors duration-150 ${
                  isActive
                    ? 'text-brand bg-brand-50'
                    : 'text-ink-secondary hover:text-ink hover:bg-surface-tertiary'
                }`}
                aria-current={isActive ? 'page' : undefined}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  return (
    <div className="flex min-h-screen flex-col bg-surface-secondary">
      <Nav />
      <main className="flex-1">
        <div className="mx-auto max-w-7xl px-6 py-10">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/score" element={<ScorePage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/responsible-ai" element={<ResponsibleAIPage />} />
          </Routes>
        </div>
      </main>
      <footer className="border-t border-surface-border py-8 mt-auto">
        <div className="mx-auto max-w-7xl px-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Logo />
            <span className="text-sm font-semibold text-ink">AltScore</span>
          </div>
          <p className="text-sm text-ink-tertiary">
            {'2025 AltScore Fintech Demo. Synthetic data only.'}
          </p>
        </div>
      </footer>
    </div>
  );
}
