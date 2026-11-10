import { useState, type FormEvent } from 'react';
import {
  Library,
  GraduationCap,
  BookMarked,
  ShieldCheck,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import type { Role, User } from '../types';
import { DEMO_PASSWORD } from '../data';

type Props = {
  onLogin: (email: string, password: string) => User | null;
  initialRole?: Role;
};

export default function LoginPage({ onLogin, initialRole = 'student' }: Props) {
  const [role, setRole] = useState<Role>(initialRole);
  const [email, setEmail] = useState(
    initialRole === 'student'
      ? 'student@bookbeacon.demo'
      : 'librarian@bookbeacon.demo'
  );
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const selectRole = (r: Role) => {
    setRole(r);
    setError(null);
    setEmail(r === 'student' ? 'student@bookbeacon.demo' : 'librarian@bookbeacon.demo');
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const user = onLogin(email, password);
    if (!user) {
      setError('Incorrect email or password. Use the demo credentials below.');
    }
  };

  const fillDemo = () => {
    setEmail(role === 'student' ? 'student@bookbeacon.demo' : 'librarian@bookbeacon.demo');
    setPassword(DEMO_PASSWORD);
    setError(null);
  };

  return (
    <div className="min-h-screen flex">
      {/* Left brand panel */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-navy-900 via-navy-800 to-navy-950 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-96 h-96 rounded-full bg-cyan-400 blur-3xl" />
          <div className="absolute bottom-0 -left-20 w-80 h-80 rounded-full bg-cyan-500 blur-3xl" />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-400 flex items-center justify-center shadow-xl shadow-cyan-400/20">
              <Library className="w-7 h-7 text-navy-900" />
            </div>
            <span className="font-display font-extrabold text-2xl">BookBeacon</span>
          </div>

          <div>
            <h1 className="font-display font-extrabold text-4xl xl:text-5xl leading-tight">
              Smart Library
              <span className="block text-cyan-400">Management System</span>
            </h1>
            <p className="mt-5 text-navy-200 text-lg max-w-md leading-relaxed">
              Role-based access for students and librarians. Search the
              catalogue, navigate to any shelf with simulated beacon guidance,
              and manage the whole floor plan.
            </p>
            <div className="mt-8 space-y-3">
              {[
                'Instant partial-title book search',
                'Visual grid floor-map editor',
                'Dynamic book-to-shelf mapping',
              ].map((t) => (
                <div key={t} className="flex items-center gap-3 text-navy-100">
                  <ShieldCheck className="w-5 h-5 text-cyan-400 shrink-0" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="text-navy-400 text-xs">
            Prototype authentication — not for production use.
          </p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10 bg-navy-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-11 h-11 rounded-xl bg-cyan-400 flex items-center justify-center">
              <Library className="w-6 h-6 text-navy-900" />
            </div>
            <span className="font-display font-extrabold text-xl text-navy-900">
              BookBeacon
            </span>
          </div>

          <h2 className="font-display font-bold text-2xl text-navy-900">
            Welcome back
          </h2>
          <p className="text-navy-500 mt-1 text-sm">
            Choose your role and sign in to continue.
          </p>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mt-6">
            <RoleCard
              active={role === 'student'}
              onClick={() => selectRole('student')}
              icon={GraduationCap}
              title="Student"
              desc="Search & navigate"
            />
            <RoleCard
              active={role === 'librarian'}
              onClick={() => selectRole('librarian')}
              icon={BookMarked}
              title="Librarian"
              desc="Manage library"
            />
          </div>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <label className="block">
              <span className="block text-xs font-semibold uppercase tracking-wide text-navy-500 mb-1.5">
                Email
              </span>
              <div className="flex items-center gap-3 bg-white rounded-lg border border-navy-200 px-3.5 py-2.5 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-100 transition-all">
                <Mail className="w-5 h-5 text-navy-400 shrink-0" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="flex-1 bg-transparent outline-none text-sm text-navy-900 placeholder-navy-400"
                  placeholder="you@bookbeacon.demo"
                />
              </div>
            </label>

            <label className="block">
              <span className="block text-xs font-semibold uppercase tracking-wide text-navy-500 mb-1.5">
                Password
              </span>
              <div className="flex items-center gap-3 bg-white rounded-lg border border-navy-200 px-3.5 py-2.5 focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-100 transition-all">
                <Lock className="w-5 h-5 text-navy-400 shrink-0" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="flex-1 bg-transparent outline-none text-sm text-navy-900 placeholder-navy-400"
                  placeholder="Demo password"
                />
              </div>
            </label>

            {error && (
              <div className="flex items-start gap-2 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3.5 py-3">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full px-5 py-3 rounded-lg bg-cyan-500 text-white font-semibold hover:bg-cyan-600 transition-colors flex items-center justify-center gap-2"
            >
              Sign in as {role === 'student' ? 'Student' : 'Librarian'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>

          {/* Demo credentials helper */}
          <div className="mt-6 rounded-xl border border-dashed border-cyan-300 bg-cyan-50/60 p-4">
            <div className="flex items-center gap-2 text-cyan-700 mb-2">
              <Sparkles className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">
                Demo credentials
              </span>
            </div>
            <div className="text-sm text-navy-700 space-y-1">
              <p>
                <span className="font-medium">Student:</span>{' '}
                student@bookbeacon.demo
              </p>
              <p>
                <span className="font-medium">Librarian:</span>{' '}
                librarian@bookbeacon.demo
              </p>
              <p>
                <span className="font-medium">Password:</span> {DEMO_PASSWORD}
              </p>
            </div>
            <button
              onClick={fillDemo}
              className="mt-3 text-sm font-semibold text-cyan-700 hover:text-cyan-800 flex items-center gap-1"
            >
              Auto-fill credentials <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RoleCard({
  active,
  onClick,
  icon: Icon,
  title,
  desc,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Library;
  title: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`text-left p-4 rounded-xl border-2 transition-all ${
        active
          ? 'border-cyan-400 bg-cyan-50 shadow-sm'
          : 'border-navy-100 bg-white hover:border-navy-300'
      }`}
    >
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center mb-2 ${
          active ? 'bg-cyan-500' : 'bg-navy-100'
        }`}
      >
        <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-navy-500'}`} />
      </div>
      <div
        className={`font-display font-bold text-sm ${
          active ? 'text-cyan-800' : 'text-navy-900'
        }`}
      >
        {title}
      </div>
      <div className="text-xs text-navy-500 mt-0.5">{desc}</div>
    </button>
  );
}
