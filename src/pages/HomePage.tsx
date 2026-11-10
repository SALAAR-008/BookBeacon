import { useState } from 'react';
import {
  Search,
  MapPin,
  Radio,
  ArrowRight,
  Library,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import type { PageId, Role } from '../types';

type Props = {
  onNavigate: (page: PageId) => void;
  onSearch: (query: string) => void;
  role: Role;
};

const FEATURES = [
  {
    icon: Search,
    title: 'Smart Search',
    desc: 'Find any book instantly with partial title matching. Type a few letters and BookBeacon surfaces the right shelf.',
    accent: 'from-cyan-400 to-cyan-600',
  },
  {
    icon: MapPin,
    title: 'Shelf Locator',
    desc: 'Every result returns a precise shelf code so you know exactly which aisle and row to walk to.',
    accent: 'from-navy-600 to-navy-800',
  },
  {
    icon: Radio,
    title: 'Beacon Navigation',
    desc: 'A simulated indoor beacon plots a clear walking route from the entrance straight to your book.',
    accent: 'from-cyan-500 to-navy-600',
  },
];

export default function HomePage({ onNavigate, onSearch, role }: Props) {
  const [query, setQuery] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
    onNavigate('search');
  };

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-navy-900 via-navy-800 to-navy-950 text-white">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-96 h-96 rounded-full bg-cyan-400 blur-3xl" />
          <div className="absolute bottom-0 -left-20 w-80 h-80 rounded-full bg-cyan-500 blur-3xl" />
        </div>
        <div className="relative max-w-6xl mx-auto px-6 sm:px-10 py-16 sm:py-24">
          <div className="flex items-center gap-3 mb-6 animate-fade-in">
            <div className="w-12 h-12 rounded-xl bg-cyan-400 flex items-center justify-center shadow-xl shadow-cyan-400/20">
              <Library className="w-7 h-7 text-navy-900" />
            </div>
            <span className="font-display font-extrabold text-2xl">
              BookBeacon
            </span>
          </div>

          <h1 className="font-display font-extrabold text-4xl sm:text-6xl leading-tight max-w-3xl animate-slide-up">
            Find any book.
            <span className="block text-cyan-400">Reach the right shelf.</span>
          </h1>
          <p className="mt-6 text-lg sm:text-xl text-navy-200 max-w-2xl leading-relaxed animate-slide-up">
            The smart library management system that combines instant search
            with simulated beacon-guided navigation — from query to shelf in
            seconds.
          </p>

          {/* Search bar */}
          <form
            onSubmit={submit}
            className="mt-10 max-w-2xl animate-slide-up"
          >
            <div className="flex flex-col sm:flex-row gap-3 bg-white rounded-2xl p-2 shadow-2xl">
              <div className="flex-1 flex items-center gap-3 px-4">
                <Search className="w-5 h-5 text-navy-400 shrink-0" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by title e.g. 'data', 'thermo', 'digital'…"
                  className="flex-1 py-3 text-navy-900 placeholder-navy-400 bg-transparent outline-none text-base"
                />
              </div>
              <button
                type="submit"
                className="px-6 py-3 rounded-xl bg-cyan-400 text-navy-900 font-semibold hover:bg-cyan-300 transition-colors flex items-center justify-center gap-2"
              >
                <Search className="w-5 h-5" />
                Find My Book
              </button>
            </div>
          </form>

          <div className="mt-6 flex items-center gap-2 text-sm text-navy-300">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>
              Try:{' '}
              {['Engineering', 'Data', 'Thermo', 'Digital'].map((s, i) => (
                <button
                  key={s}
                  onClick={() => {
                    setQuery(s);
                    onSearch(s);
                    onNavigate('search');
                  }}
                  className="inline-block mx-1 px-2 py-0.5 rounded-md bg-navy-700/60 hover:bg-navy-600 text-cyan-300 transition-colors"
                >
                  {s}
                  {i < 3 ? '' : ''}
                </button>
              ))}
            </span>
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="max-w-6xl mx-auto px-6 sm:px-10 py-16">
        <div className="text-center mb-12">
          <p className="text-cyan-600 font-semibold text-sm uppercase tracking-wider">
            How it works
          </p>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-navy-900 mt-2">
            Three steps from query to book in hand
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <button
                key={f.title}
                onClick={() => onNavigate('search')}
                className="group text-left bg-white rounded-2xl p-7 border border-navy-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all animate-slide-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${f.accent} flex items-center justify-center mb-5 shadow-lg`}
                >
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-display font-bold text-xl text-navy-900 mb-2">
                  {f.title}
                </h3>
                <p className="text-navy-500 leading-relaxed text-sm">
                  {f.desc}
                </p>
                <div className="mt-5 flex items-center gap-1 text-cyan-600 font-semibold text-sm group-hover:gap-2 transition-all">
                  Try it now
                  <ArrowRight className="w-4 h-4" />
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Stats band */}
      <section className="bg-navy-900 text-white">
        <div className="max-w-6xl mx-auto px-6 sm:px-10 py-12 grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { label: 'Books catalogued', value: '12+' },
            { label: 'Shelf zones', value: '4' },
            { label: 'Avg. find time', value: '< 30s' },
            { label: 'Beacon range', value: 'Full floor' },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="font-display font-extrabold text-3xl sm:text-4xl text-cyan-400">
                {s.value}
              </div>
              <div className="text-navy-300 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA — librarian only */}
      {role === 'librarian' && (
        <section className="max-w-6xl mx-auto px-6 sm:px-10 py-16">
          <div className="rounded-3xl bg-gradient-to-br from-cyan-500 to-navy-700 p-8 sm:p-12 text-white flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-2xl bg-white/15 flex items-center justify-center backdrop-blur">
                <BookOpen className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-display font-bold text-2xl">
                  Explore the librarian dashboard
                </h3>
                <p className="text-white/80 mt-1">
                  Manage inventory, update shelves and track availability.
                </p>
              </div>
            </div>
            <button
              onClick={() => onNavigate('dashboard')}
              className="px-6 py-3 rounded-xl bg-white text-navy-900 font-semibold hover:bg-cyan-50 transition-colors flex items-center gap-2 whitespace-nowrap"
            >
              Open Dashboard
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
