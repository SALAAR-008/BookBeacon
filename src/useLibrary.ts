import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Book, LibraryMap, MapCell, Rack, Section, ShelfCoord, ShelfModel } from './types';
import {
  SEED_BOOKS,
  SEED_MAP,
  SEED_RACKS,
  SEED_SECTIONS,
  SEED_SHELVES,
  GRID_COLS,
  GRID_ROWS,
} from './data';

const BOOKS_KEY = 'bookbeacon.books.v3';
const SECTIONS_KEY = 'bookbeacon.sections.v3';
const RACKS_KEY = 'bookbeacon.racks.v3';
const SHELVES_KEY = 'bookbeacon.shelves.v3';
const MAP_KEY = 'bookbeacon.map.v3';

// Old v2 keys for migration
const OLD_BOOKS_KEY = 'bookbeacon.books.v2';
const OLD_MAP_KEY = 'bookbeacon.map.v2';

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as T;
    return parsed ?? fallback;
  } catch {
    return fallback;
  }
}

function loadArray<T>(key: string, fallback: T[]): T[] {
  const parsed = loadJSON<T[] | null>(key, null);
  if (!Array.isArray(parsed) || parsed.length === 0) return fallback;
  return parsed;
}

function normalizeBook(raw: unknown): Book {
  const b = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  let rackId = typeof b.rackId === 'string' ? b.rackId : '';
  let shelfNumber = typeof b.shelfNumber === 'number' ? b.shelfNumber : 1;
  let shelfId = typeof b.shelfId === 'string' ? b.shelfId : '';
  let sectionId = typeof b.sectionId === 'string' ? b.sectionId : '';

  // Old shelf property fallback (e.g. "A-03" or "A-03-2")
  if (!rackId && typeof b.shelf === 'string') {
    const parts = b.shelf.split('-');
    if (parts.length >= 2) {
      rackId = `${parts[0]}-${parts[1]}`;
      if (parts.length >= 3) {
        shelfNumber = parseInt(parts[2], 10) || 1;
      }
    } else {
      rackId = b.shelf;
    }
  }

  if (!sectionId && rackId) {
    const secLetter = rackId.split('-')[0].toLowerCase();
    sectionId = `sec-${secLetter}`;
  }

  if (!shelfId && rackId) {
    shelfId = `${rackId}-${shelfNumber}`;
  }

  return {
    id: typeof b.id === 'string' ? b.id : `b${Date.now()}`,
    title: typeof b.title === 'string' ? b.title : 'Untitled',
    author: typeof b.author === 'string' ? b.author : 'Unknown',
    sectionId: sectionId || 'sec-a',
    rackId: rackId || 'A-01',
    shelfId: shelfId || 'A-01-1',
    shelfNumber: shelfNumber || 1,
    isbn: typeof b.isbn === 'string' ? b.isbn : '',
    category: typeof b.category === 'string' ? b.category : 'General',
    description: typeof b.description === 'string' ? b.description : '',
    available: typeof b.available === 'boolean' ? b.available : true,
    copies: typeof b.copies === 'number' && b.copies > 0 ? b.copies : 1,
    createdAt: typeof b.createdAt === 'number' ? b.createdAt : Date.now(),
  };
}

function loadBooks(): Book[] {
  try {
    const raw = localStorage.getItem(BOOKS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.map(normalizeBook);
      }
    }
    const oldRaw = localStorage.getItem(OLD_BOOKS_KEY);
    if (oldRaw) {
      const oldParsed = JSON.parse(oldRaw);
      if (Array.isArray(oldParsed) && oldParsed.length > 0) {
        return oldParsed.map(normalizeBook);
      }
    }
  } catch {
    // ignore
  }
  return SEED_BOOKS;
}

function normalizeMap(raw: unknown): LibraryMap {
  if (!raw || typeof raw !== 'object') return SEED_MAP;
  const m = raw as Partial<LibraryMap>;
  const entrance =
    m.entrance && typeof m.entrance.gridX === 'number' && typeof m.entrance.gridY === 'number'
      ? m.entrance
      : SEED_MAP.entrance;

  if (!Array.isArray(m.cells) || m.cells.length === 0) {
    return { entrance, cells: SEED_MAP.cells };
  }

  const cells: MapCell[] = m.cells.map((c: Record<string, unknown>, idx: number) => {
    const isShelf = c.type === 'shelf';
    const rackId = (c.rackId || (isShelf ? c.shelfId : undefined)) as string | undefined;
    return {
      id: typeof c.id === 'string' ? c.id : `cell-${idx}`,
      type: (isShelf ? 'rack' : (c.type ?? 'empty')) as MapCell['type'],
      gridX: typeof c.gridX === 'number' ? c.gridX : 0,
      gridY: typeof c.gridY === 'number' ? c.gridY : 0,
      ...(rackId ? { rackId: String(rackId) } : {}),
    };
  });

  return { entrance, cells };
}

function loadMap(): LibraryMap {
  try {
    const raw = localStorage.getItem(MAP_KEY);
    if (raw) {
      return normalizeMap(JSON.parse(raw));
    }
    const oldRaw = localStorage.getItem(OLD_MAP_KEY);
    if (oldRaw) {
      return normalizeMap(JSON.parse(oldRaw));
    }
  } catch {
    // fallback
  }
  return SEED_MAP;
}

export function useLibrary() {
  const [books, setBooks] = useState<Book[]>(() => loadBooks());
  const [sections, setSections] = useState<Section[]>(() =>
    loadArray<Section>(SECTIONS_KEY, SEED_SECTIONS)
  );
  const [racks, setRacks] = useState<Rack[]>(() =>
    loadArray<Rack>(RACKS_KEY, SEED_RACKS)
  );
  const [shelves, setShelves] = useState<ShelfModel[]>(() =>
    loadArray<ShelfModel>(SHELVES_KEY, SEED_SHELVES)
  );
  const [map, setMap] = useState<LibraryMap>(() => loadMap());

  // Persist everything
  useEffect(() => {
    try { localStorage.setItem(BOOKS_KEY, JSON.stringify(books)); } catch { /* */ }
  }, [books]);
  useEffect(() => {
    try { localStorage.setItem(SECTIONS_KEY, JSON.stringify(sections)); } catch { /* */ }
  }, [sections]);
  useEffect(() => {
    try { localStorage.setItem(RACKS_KEY, JSON.stringify(racks)); } catch { /* */ }
  }, [racks]);
  useEffect(() => {
    try { localStorage.setItem(SHELVES_KEY, JSON.stringify(shelves)); } catch { /* */ }
  }, [shelves]);
  useEffect(() => {
    try { localStorage.setItem(MAP_KEY, JSON.stringify(map)); } catch { /* */ }
  }, [map]);

  // ---- Book CRUD ----
  const addBook = useCallback((book: Omit<Book, 'id' | 'createdAt'>) => {
    setBooks((prev) => [
      { ...book, id: `b${Date.now()}`, createdAt: Date.now() },
      ...prev,
    ]);
  }, []);

  const updateBook = useCallback((id: string, patch: Partial<Book>) => {
    setBooks((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...patch } : b))
    );
  }, []);

  const deleteBook = useCallback((id: string) => {
    setBooks((prev) => prev.filter((b) => b.id !== id));
  }, []);

  const resetBooks = useCallback(() => setBooks(SEED_BOOKS), []);

  // ---- Section CRUD ----
  const addSection = useCallback((section: Omit<Section, 'id'>) => {
    setSections((prev) => [...prev, { ...section, id: `sec-${Date.now()}` }]);
  }, []);

  const updateSection = useCallback((id: string, patch: Partial<Section>) => {
    setSections((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...patch } : s))
    );
  }, []);

  const deleteSection = useCallback((id: string) => {
    // also delete racks and shelves in this section, and books referencing them
    const rackIdsInSection = racks.filter((r) => r.sectionId === id).map((r) => r.id);
    setRacks((prev) => prev.filter((r) => r.sectionId !== id));
    setShelves((prev) => prev.filter((s) => !rackIdsInSection.includes(s.rackId)));
    setBooks((prev) => prev.filter((b) => b.sectionId !== id));
    setSections((prev) => prev.filter((s) => s.id !== id));
  }, [racks]);

  // ---- Rack CRUD ----
  const addRack = useCallback(
    (rackData: Omit<Rack, 'id'> & { id?: string }) => {
      const rackId = rackData.id && rackData.id.trim() ? rackData.id.trim() : `R-${Date.now()}`;
      const newRack: Rack = { ...rackData, id: rackId };
      setRacks((prev) => [...prev, newRack]);
      // auto-create shelves
      const newShelves: ShelfModel[] = Array.from(
        { length: newRack.numberOfShelves },
        (_, i) => ({
          id: `${newRack.id}-${i + 1}`,
          rackId: newRack.id,
          shelfNumber: i + 1,
        })
      );
      setShelves((prev) => [...prev, ...newShelves]);
      // add map cell if coordinates within grid
      setMap((prev) => {
        const alreadyHasCell = prev.cells.some((c) => c.rackId === newRack.id);
        if (alreadyHasCell) return prev;
        return {
          ...prev,
          cells: [
            ...prev.cells,
            {
              id: `cell-${newRack.id}`,
              type: 'rack',
              gridX: newRack.gridX,
              gridY: newRack.gridY,
              rackId: newRack.id,
            },
          ],
        };
      });
    },
    []
  );

  const updateRack = useCallback((id: string, patch: Partial<Rack>) => {
    setRacks((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    // if numberOfShelves changed, sync shelves
    if (patch.numberOfShelves !== undefined) {
      setShelves((prev) => {
        const existing = prev.filter((s) => s.rackId === id);
        const target = patch.numberOfShelves!;
        if (existing.length === target) return prev;
        if (existing.length < target) {
          // add shelves
          const toAdd: ShelfModel[] = Array.from(
            { length: target - existing.length },
            (_, i) => ({
              id: `${id}-${existing.length + i + 1}`,
              rackId: id,
              shelfNumber: existing.length + i + 1,
            })
          );
          return [...prev, ...toAdd];
        }
        // remove extra shelves (keep first `target`)
        const keep = new Set(
          existing.slice(0, target).map((s) => s.id)
        );
        return prev.filter((s) => s.rackId !== id || keep.has(s.id));
      });
    }
    // update map cell coordinates if changed
    if (patch.gridX !== undefined || patch.gridY !== undefined) {
      setMap((prev) => ({
        ...prev,
        cells: prev.cells.map((c) =>
          c.rackId === id
            ? {
                ...c,
                gridX: patch.gridX ?? c.gridX,
                gridY: patch.gridY ?? c.gridY,
              }
            : c
        ),
      }));
    }
  }, []);

  const deleteRack = useCallback((id: string) => {
    setRacks((prev) => prev.filter((r) => r.id !== id));
    setShelves((prev) => prev.filter((s) => s.rackId !== id));
    setBooks((prev) => prev.filter((b) => b.rackId !== id));
    setMap((prev) => ({
      ...prev,
      cells: prev.cells.filter((c) => c.rackId !== id),
    }));
  }, []);

  // ---- Map editing ----
  const saveMap = useCallback((next: LibraryMap) => {
    setMap(next);
    // sync rack coordinates from map cells and auto-add any newly placed racks
    setRacks((prev) => {
      const rackMap = new Map<string, Rack>();
      prev.forEach((r) => rackMap.set(r.id, { ...r }));

      next.cells
        .filter((c) => c.type === 'rack' && Boolean(c.rackId))
        .forEach((c) => {
          const rackId = c.rackId as string;
          const existing = rackMap.get(rackId);
          if (existing) {
            existing.gridX = c.gridX;
            existing.gridY = c.gridY;
          } else {
            const secCode = rackId.split('-')[0].toLowerCase();
            const section = sections.find(
              (s) => s.code.toLowerCase() === secCode || s.id === `sec-${secCode}`
            ) ?? sections[0] ?? { id: 'sec-a', name: 'Section A', code: 'A', description: '' };

            rackMap.set(rackId, {
              id: rackId,
              sectionId: section.id,
              rackName: `Rack ${rackId}`,
              numberOfShelves: 5,
              gridX: c.gridX,
              gridY: c.gridY,
            });
          }
        });

      const updatedRacks = Array.from(rackMap.values());

      // Auto-create shelves for any new racks
      setShelves((prevShelves) => {
        const shelfMap = new Map<string, ShelfModel>();
        prevShelves.forEach((s) => shelfMap.set(s.id, s));

        updatedRacks.forEach((r) => {
          for (let i = 1; i <= r.numberOfShelves; i++) {
            const sId = `${r.id}-${i}`;
            if (!shelfMap.has(sId)) {
              shelfMap.set(sId, {
                id: sId,
                rackId: r.id,
                shelfNumber: i,
              });
            }
          }
        });

        return Array.from(shelfMap.values());
      });

      return updatedRacks;
    });
  }, [sections]);

  const resetMap = useCallback(() => setMap(SEED_MAP), []);

  const resetAll = useCallback(() => {
    setBooks(SEED_BOOKS);
    setSections(SEED_SECTIONS);
    setRacks(SEED_RACKS);
    setShelves(SEED_SHELVES);
    setMap(SEED_MAP);
  }, []);

  // ---- Derived ----
  const mappedRackIds = useMemo(
    () =>
      new Set(
        map.cells
          .filter((c) => c.type === 'rack' && Boolean(c.rackId))
          .map((c) => c.rackId as string)
      ),
    [map]
  );

  const mappedShelfIds = useMemo(
    () =>
      new Set(
        shelves
          .filter((s) => mappedRackIds.has(s.rackId))
          .map((s) => s.id)
      ),
    [shelves, mappedRackIds]
  );

  const rackCoords: ShelfCoord[] = useMemo(
    () =>
      map.cells
        .filter((c) => c.type === 'rack' && Boolean(c.rackId))
        .map((c) => ({
          rackId: c.rackId as string,
          x: c.gridX,
          y: c.gridY,
        })),
    [map]
  );

  const coordForRack = useCallback(
    (rackId: string): ShelfCoord | null =>
      rackCoords.find((s) => s.rackId === rackId) ?? null,
    [rackCoords]
  );

  return {
    books,
    sections,
    racks,
    shelves,
    map,
    addBook,
    updateBook,
    deleteBook,
    resetBooks,
    addSection,
    updateSection,
    deleteSection,
    addRack,
    updateRack,
    deleteRack,
    saveMap,
    resetMap,
    resetAll,
    mappedRackIds,
    mappedShelfIds,
    rackCoords,
    coordForRack,
    grid: { cols: GRID_COLS, rows: GRID_ROWS },
  };
}
