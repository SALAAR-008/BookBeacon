import { useCallback, useEffect, useState } from 'react';
import type { User } from './types';
import { SEED_USERS, DEMO_PASSWORD } from './data';

const SESSION_KEY = 'bookbeacon.session.v1';

export function isValidUser(u: unknown): u is User {
  if (!u || typeof u !== 'object') return false;
  const candidate = u as Partial<User>;
  return (
    typeof candidate.id === 'string' &&
    candidate.id.trim().length > 0 &&
    typeof candidate.name === 'string' &&
    candidate.name.trim().length > 0 &&
    typeof candidate.email === 'string' &&
    candidate.email.trim().length > 0 &&
    (candidate.role === 'student' || candidate.role === 'librarian')
  );
}

function loadSession(): User | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (isValidUser(parsed)) {
      return parsed;
    }
    // Invalid or outdated session: clear safely
    localStorage.removeItem(SESSION_KEY);
    return null;
  } catch {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore
    }
    return null;
  }
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => loadSession());

  useEffect(() => {
    try {
      if (user && isValidUser(user)) {
        localStorage.setItem(SESSION_KEY, JSON.stringify(user));
      } else {
        localStorage.removeItem(SESSION_KEY);
      }
    } catch {
      // ignore
    }
  }, [user]);

  const login = useCallback((email: string, password: string): User | null => {
    const found = SEED_USERS.find(
      (u) => u.email.toLowerCase() === email.trim().toLowerCase()
    );
    if (!found) return null;
    if (password !== DEMO_PASSWORD) return null;
    setUser(found);
    return found;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch {
      // ignore
    }
  }, []);

  return { user, login, logout, isValidUser };
}

