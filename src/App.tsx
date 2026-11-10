import { useCallback, useEffect, useState } from 'react';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import HomePage from './pages/HomePage';
import SearchPage from './pages/SearchPage';
import DetailsPage from './pages/DetailsPage';
import NavigationPage from './pages/NavigationPage';
import DashboardPage from './pages/DashboardPage';
import MapEditorPage from './pages/MapEditorPage';
import LoginPage from './pages/LoginPage';
import { useAuth } from './useAuth';
import { useLibrary } from './useLibrary';
import type { Book, PageId, Role, User } from './types';

// pages a student may visit
const STUDENT_PAGES: PageId[] = ['home', 'search', 'details', 'navigation'];
// pages a librarian may visit (includes management pages)
const LIBRARIAN_PAGES: PageId[] = [
  'home',
  'search',
  'details',
  'navigation',
  'dashboard',
  'mapeditor',
];

function isAllowed(page: PageId, role: Role): boolean {
  return role === 'librarian'
    ? LIBRARIAN_PAGES.includes(page)
    : STUDENT_PAGES.includes(page);
}

function defaultPageFor(role: Role): PageId {
  return role === 'librarian' ? 'home' : 'home';
}

export default function App() {
  const { user, login, logout } = useAuth();
  const lib = useLibrary();

  const [page, setPage] = useState<PageId>('home');
  const [query, setQuery] = useState('');
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [selectedRackId, setSelectedRackId] = useState<string | null>(null);
  // remember which role login screen is showing
  const [loginRole, setLoginRole] = useState<Role>('student');

  // ---- Route protection ----
  // If not logged in, show login.
  // If logged in but current page isn't allowed for the role, redirect.
  useEffect(() => {
    if (!user || (user.role !== 'student' && user.role !== 'librarian')) return;
    if (!isAllowed(page, user.role)) {
      setPage(defaultPageFor(user.role));
    }
  }, [user, page]);

  const navigate = useCallback(
    (p: PageId) => {
      if (user && !isAllowed(p, user.role)) {
        setPage(defaultPageFor(user.role));
        return;
      }
      setPage(p);
    },
    [user]
  );

  const handleLogin = useCallback(
    (email: string, password: string): User | null => {
      const u = login(email, password);
      if (u) {
        setLoginRole(u.role);
        setPage('home');
      }
      return u;
    },
    [login]
  );

  const handleLogout = useCallback(() => {
    logout();
    setPage('home');
    setQuery('');
    setSelectedBook(null);
    setSelectedRackId(null);
  }, [logout]);

  const search = (q: string) => setQuery(q);

  const selectBook = (book: Book) => {
    setSelectedBook(book);
    setSelectedRackId(book.rackId);
  };

  const navigateToShelf = (rackId: string, book?: Book) => {
    setSelectedRackId(rackId);
    if (book) {
      setSelectedBook(book);
    }
    setPage('navigation');
  };

  // ---- Not logged in or invalid user: show login ----
  if (!user || (user.role !== 'student' && user.role !== 'librarian')) {
    return (
      <ErrorBoundary>
        <LoginPage onLogin={handleLogin} initialRole={loginRole} />
      </ErrorBoundary>
    );
  }

  // ---- Logged in: render app shell ----
  return (
    <ErrorBoundary>
      <Layout
        current={page}
        onNavigate={navigate}
        user={user}
        onLogout={handleLogout}
      >
        {page === 'home' && (
          <HomePage
            onNavigate={navigate}
            onSearch={search}
            role={user.role}
          />
        )}

        {page === 'search' && (
          <SearchPage
            books={lib.books}
            mappedRackIds={lib.mappedRackIds}
            sections={lib.sections}
            racks={lib.racks}
            initialQuery={query}
            onQueryChange={setQuery}
            onSelectBook={selectBook}
            onNavigate={navigate}
          />
        )}

        {page === 'details' && (
          <DetailsPage
            book={selectedBook}
            sections={lib.sections}
            racks={lib.racks}
            mappedRackIds={lib.mappedRackIds}
            onNavigate={navigate}
            onNavigateToShelf={navigateToShelf}
          />
        )}

        {page === 'navigation' && (
          <NavigationPage
            books={lib.books}
            map={lib.map}
            sections={lib.sections}
            racks={lib.racks}
            shelves={lib.shelves}
            selectedRackId={selectedRackId}
            selectedBook={selectedBook}
            onSelectRack={setSelectedRackId}
            onSelectBook={setSelectedBook}
          />
        )}

        {page === 'dashboard' && user.role === 'librarian' && (
          <DashboardPage
            books={lib.books}
            sections={lib.sections}
            racks={lib.racks}
            shelves={lib.shelves}
            mappedRackIds={lib.mappedRackIds}
            mappedShelfIds={lib.mappedShelfIds}
            onAdd={lib.addBook}
            onUpdate={lib.updateBook}
            onDelete={lib.deleteBook}
            onReset={lib.resetAll}
            onNavigateMap={() => setPage('mapeditor')}
            onAddRack={lib.addRack}
            onUpdateRack={lib.updateRack}
            onDeleteRack={lib.deleteRack}
          />
        )}

        {page === 'mapeditor' && user.role === 'librarian' && (
          <MapEditorPage
            map={lib.map}
            sections={lib.sections}
            racks={lib.racks}
            onSave={lib.saveMap}
            onReset={lib.resetMap}
          />
        )}
      </Layout>
    </ErrorBoundary>
  );
}
