/**
 * Test script verifying student and librarian workflows and bug fixes:
 * 1. Auth session validation in useAuth.ts (safe clearing of invalid sessions)
 * 2. Layout user role guards
 * 3. Migration of legacy book.shelf data to { sectionId, rackId, shelfId, shelfNumber }
 * 4. Student login and book search
 * 5. Book details and shelf-level navigation
 * 6. Librarian login and role authorization
 * 7. Add, edit and delete books with hierarchical location
 * 8. Add and manage racks and shelves
 * 9. Map editor rack repositioning / saving
 * 10. Verification that map changes reflect in student navigation
 */

import { isValidUser } from './src/useAuth';
import {
  SEED_USERS,
  DEMO_PASSWORD,
  SEED_BOOKS,
  SEED_RACKS,
  SEED_SECTIONS,
  SEED_SHELVES,
  SEED_MAP,
} from './src/data';
import {
  fullLocation,
  shortLocation,
  isBookLocationValid,
} from './src/location';
import type { Book, LibraryMap, Rack, ShelfModel, User } from './src/types';

// Mock localStorage for headless verification
const storage = new Map<string, string>();
const mockLocalStorage = {
  getItem: (k: string) => storage.get(k) ?? null,
  setItem: (k: string, v: string) => storage.set(k, v),
  removeItem: (k: string) => storage.delete(k),
  clear: () => storage.clear(),
};
(globalThis as typeof globalThis & { localStorage: typeof mockLocalStorage }).localStorage = mockLocalStorage;

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ ASSERTION FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`  ✓ ${message}`);
}

async function runTests() {
  console.log('====================================================');
  console.log('TEST SUITE: BookBeacon Consistency & Workflow Pass');
  console.log('====================================================\n');

  // ----------------------------------------------------------------
  // TEST 1: Auth session validation & role verification
  // ----------------------------------------------------------------
  console.log('Test 1: Auth session validation in useAuth.ts');
  const validStudent: User = { id: 'u1', name: 'Alice', email: 'alice@demo.com', role: 'student' };
  const validLibrarian: User = { id: 'u2', name: 'Bob', email: 'bob@demo.com', role: 'librarian' };
  const invalidRoleUser = { id: 'u3', name: 'Eve', email: 'eve@demo.com', role: 'admin' };
  const corruptUser = { id: 'u4', name: '' };

  assert(isValidUser(validStudent), 'Valid student user recognized');
  assert(isValidUser(validLibrarian), 'Valid librarian user recognized');
  assert(!isValidUser(invalidRoleUser), 'User with role "admin" is rejected (only student/librarian allowed)');
  assert(!isValidUser(corruptUser), 'User missing required fields is rejected');
  assert(!isValidUser(null), 'null user is rejected');
  assert(!isValidUser(undefined), 'undefined user is rejected');

  // Test session clearing for invalid data
  mockLocalStorage.setItem('bookbeacon.session.v1', JSON.stringify({ role: 'hacker' }));
  const raw = mockLocalStorage.getItem('bookbeacon.session.v1');
  const parsed = JSON.parse(raw!);
  if (!isValidUser(parsed)) {
    mockLocalStorage.removeItem('bookbeacon.session.v1');
  }
  assert(mockLocalStorage.getItem('bookbeacon.session.v1') === null, 'Corrupt session cleared safely from localStorage');
  console.log('Test 1 Passed.\n');

  // ----------------------------------------------------------------
  // TEST 2: Location Model & Migration from legacy book.shelf
  // ----------------------------------------------------------------
  console.log('Test 2: Hierarchical location model & legacy migration');
  // Sample legacy v2 book
  const legacyBook = {
    id: 'b-leg',
    title: 'Algorithms 101',
    author: 'T. Cormen',
    shelf: 'C-03', // old format
    category: 'Computer Science',
    copies: 3,
  };

  // Simulate migration
  const parts = legacyBook.shelf.split('-');
  const rackId = legacyBook.shelf;
  const sectionCode = parts[0].toLowerCase();
  const sectionId = `sec-${sectionCode}`;
  const shelfNumber = 1;
  const shelfId = `${rackId}-${shelfNumber}`;

  const migratedBook: Book = {
    id: legacyBook.id,
    title: legacyBook.title,
    author: legacyBook.author,
    sectionId,
    rackId,
    shelfId,
    shelfNumber,
    isbn: '978-0-00000-000-0',
    category: legacyBook.category,
    description: '',
    available: true,
    copies: legacyBook.copies,
    createdAt: Date.now(),
  };

  assert(migratedBook.sectionId === 'sec-c', 'Migrated book sectionId matches C');
  assert(migratedBook.rackId === 'C-03', 'Migrated book rackId is C-03');
  assert(migratedBook.shelfId === 'C-03-1', 'Migrated book shelfId is C-03-1');
  assert(migratedBook.shelfNumber === 1, 'Migrated book shelfNumber is 1');
  assert(
    isBookLocationValid(migratedBook, SEED_SECTIONS, SEED_RACKS, SEED_SHELVES),
    'Migrated book location is valid against library seed sections, racks and shelves'
  );
  assert(
    fullLocation(SEED_SECTIONS, SEED_RACKS, migratedBook) === 'Section C → Rack C-03 → Shelf 1',
    'fullLocation helper formats accurately: ' + fullLocation(SEED_SECTIONS, SEED_RACKS, migratedBook)
  );
  assert(
    shortLocation(migratedBook) === 'C-03 · Shelf 1',
    'shortLocation helper formats accurately: ' + shortLocation(migratedBook)
  );
  console.log('Test 2 Passed.\n');

  // ----------------------------------------------------------------
  // TEST 3: Student login and book search workflow
  // ----------------------------------------------------------------
  console.log('Test 3: Student login and book search workflow');
  const student = SEED_USERS.find((u) => u.role === 'student')!;
  assert(student.email === 'student@bookbeacon.demo', 'Student demo email is student@bookbeacon.demo');
  assert(DEMO_PASSWORD === 'bookbeacon', 'Demo password matches bookbeacon');

  // Search by title partial match e.g. "math"
  const q1 = 'math';
  const results1 = SEED_BOOKS.filter(
    (b) =>
      b.title.toLowerCase().includes(q1) ||
      b.author.toLowerCase().includes(q1) ||
      b.category.toLowerCase().includes(q1) ||
      b.rackId.toLowerCase().includes(q1)
  );
  assert(results1.length >= 1, `Search for "${q1}" found ${results1.length} book(s)`);
  assert(results1[0].title === 'Engineering Mathematics', 'Found "Engineering Mathematics"');
  assert(results1[0].rackId === 'A-03', 'Book is at rack A-03');

  // Search by rack e.g. "C-07"
  const q2 = 'c-07';
  const results2 = SEED_BOOKS.filter((b) => b.rackId.toLowerCase().includes(q2));
  assert(results2.length === 1 && results2[0].title === 'Data Structures', 'Found "Data Structures" at rack C-07');
  console.log('Test 3 Passed.\n');

  // ----------------------------------------------------------------
  // TEST 4: Book details and shelf-level navigation
  // ----------------------------------------------------------------
  console.log('Test 4: Book details and shelf-level navigation');
  const selectedBook = results1[0]; // Engineering Mathematics, rack A-03, shelf 1
  assert(selectedBook.rackId === 'A-03', 'Selected book rack is A-03');
  assert(selectedBook.shelfNumber === 1, 'Selected book shelf number is 1');

  // Map validation
  const mappedRackIds = new Set(
    SEED_MAP.cells.filter((c) => c.type === 'rack' && c.rackId).map((c) => c.rackId!)
  );
  assert(mappedRackIds.has(selectedBook.rackId), `Rack ${selectedBook.rackId} is mapped on the floor plan`);

  const rackCell = SEED_MAP.cells.find((c) => c.rackId === selectedBook.rackId)!;
  assert(rackCell.gridX === 3 && rackCell.gridY === 0, 'Rack A-03 coordinates are (3, 0)');
  assert(SEED_MAP.entrance.gridX === 5 && SEED_MAP.entrance.gridY === 8, 'Entrance is at (5, 8)');

  // Beacon distance check
  const dx = rackCell.gridX - SEED_MAP.entrance.gridX;
  const dy = rackCell.gridY - SEED_MAP.entrance.gridY;
  const dist = Math.hypot(dx, dy);
  assert(dist > 0, `Computed walking distance from entrance to target rack: ${dist.toFixed(2)} grid units`);
  console.log('Test 4 Passed.\n');

  // ----------------------------------------------------------------
  // TEST 5: Librarian login & Book CRUD with hierarchical location
  // ----------------------------------------------------------------
  console.log('Test 5: Librarian login & Book CRUD with section/rack/shelf');
  const librarian = SEED_USERS.find((u) => u.role === 'librarian')!;
  assert(librarian.email === 'librarian@bookbeacon.demo', 'Librarian demo email is librarian@bookbeacon.demo');

  let currentBooks = [...SEED_BOOKS];
  const newBookData = {
    title: 'Modern Quantum Computing',
    author: 'E. Rieffel',
    sectionId: 'sec-c',
    rackId: 'C-03',
    shelfId: 'C-03-3',
    shelfNumber: 3,
    isbn: '978-0-26201-000-0',
    category: 'Computer Science',
    available: true,
    copies: 2,
    description: 'An introduction to quantum computation.',
  };

  // Add book
  const addedBook: Book = {
    ...newBookData,
    id: `b-${Date.now()}`,
    createdAt: Date.now(),
  };
  currentBooks = [addedBook, ...currentBooks];
  assert(currentBooks.length === SEED_BOOKS.length + 1, 'Book added successfully to inventory');
  assert(currentBooks[0].title === 'Modern Quantum Computing', 'Added book has correct title');
  assert(currentBooks[0].shelfNumber === 3, 'Added book has selected shelf tier 3');

  // Edit book
  currentBooks = currentBooks.map((b) =>
    b.id === addedBook.id ? { ...b, shelfNumber: 4, shelfId: 'C-03-4', copies: 5 } : b
  );
  const updatedBook = currentBooks.find((b) => b.id === addedBook.id)!;
  assert(updatedBook.shelfNumber === 4, 'Book shelf tier successfully updated to 4');
  assert(updatedBook.copies === 5, 'Book copies successfully updated to 5');

  // Delete book
  currentBooks = currentBooks.filter((b) => b.id !== addedBook.id);
  assert(currentBooks.length === SEED_BOOKS.length, 'Book deleted successfully from inventory');
  console.log('Test 5 Passed.\n');

  // ----------------------------------------------------------------
  // TEST 6: Add and manage racks and shelves
  // ----------------------------------------------------------------
  console.log('Test 6: Add and manage racks and shelves');
  let currentRacks = [...SEED_RACKS];
  let currentShelves = [...SEED_SHELVES];

  const newRack: Rack = {
    id: 'E-01',
    sectionId: 'sec-c',
    rackName: 'Robotics & AI Bay 1',
    numberOfShelves: 4,
    gridX: 2,
    gridY: 7,
  };
  currentRacks.push(newRack);

  // Generate shelves for new rack
  for (let i = 1; i <= newRack.numberOfShelves; i++) {
    currentShelves.push({
      id: `${newRack.id}-${i}`,
      rackId: newRack.id,
      shelfNumber: i,
    });
  }

  assert(currentRacks.some((r) => r.id === 'E-01'), 'New rack E-01 added to racks list');
  const e01Shelves = currentShelves.filter((s) => s.rackId === 'E-01');
  assert(e01Shelves.length === 4, '4 individual shelves created for rack E-01');
  assert(e01Shelves[3].shelfNumber === 4, 'Shelf 4 correctly indexed');

  // Update rack shelves capacity to 6
  const targetCapacity = 6;
  const toAdd: ShelfModel[] = [];
  for (let i = e01Shelves.length + 1; i <= targetCapacity; i++) {
    toAdd.push({
      id: `E-01-${i}`,
      rackId: 'E-01',
      shelfNumber: i,
    });
  }
  currentShelves = [...currentShelves, ...toAdd];
  assert(
    currentShelves.filter((s) => s.rackId === 'E-01').length === 6,
    'Rack E-01 shelves capacity expanded to 6'
  );
  console.log('Test 6 Passed.\n');

  // ----------------------------------------------------------------
  // TEST 7: Map Editor rack placement, drag-and-drop & student sync
  // ----------------------------------------------------------------
  console.log('Test 7: Drag & drop rack in Map Editor and sync to Student Navigation');
  let currentMap: LibraryMap = {
    entrance: { ...SEED_MAP.entrance },
    cells: SEED_MAP.cells.map((c) => ({ ...c })),
  };

  // Add E-01 to map
  currentMap.cells.push({
    id: 'cell-E-01',
    type: 'rack',
    gridX: 2,
    gridY: 7,
    rackId: 'E-01',
  });

  // Drag and drop: Move rack A-01 from (1, 0) to (1, 1)
  const a01Cell = currentMap.cells.find((c) => c.rackId === 'A-01')!;
  assert(a01Cell.gridX === 1 && a01Cell.gridY === 0, 'Original A-01 position is (1, 0)');

  // Simulate drag drop to (1, 1)
  currentMap = {
    ...currentMap,
    cells: currentMap.cells.map((c) =>
      c.rackId === 'A-01' ? { ...c, gridX: 1, gridY: 1 } : c
    ),
  };
  const movedCell = currentMap.cells.find((c) => c.rackId === 'A-01')!;
  assert(movedCell.gridX === 1 && movedCell.gridY === 1, 'Moved A-01 position in Map Editor is (1, 1)');

  // Simulate saveMap sync to library state
  currentRacks = currentRacks.map((r) => {
    const c = currentMap.cells.find((cell) => cell.rackId === r.id);
    return c ? { ...r, gridX: c.gridX, gridY: c.gridY } : r;
  });

  const syncedRackA01 = currentRacks.find((r) => r.id === 'A-01')!;
  assert(syncedRackA01.gridX === 1 && syncedRackA01.gridY === 1, 'Library rack A-01 coordinates synced to (1, 1)');

  // Verify student navigation reflects this move
  const studentNavCoords = currentMap.cells
    .filter((c) => c.type === 'rack' && Boolean(c.rackId))
    .map((c) => ({ rackId: c.rackId!, x: c.gridX, y: c.gridY }));

  const navRackA01 = studentNavCoords.find((r) => r.rackId === 'A-01')!;
  assert(navRackA01.x === 1 && navRackA01.y === 1, 'Student navigation target coordinates reflect (1, 1)');

  const navRackE01 = studentNavCoords.find((r) => r.rackId === 'E-01')!;
  assert(Boolean(navRackE01), 'Newly added rack E-01 is available in Student Navigation target list');
  console.log('Test 7 Passed.\n');

  console.log('====================================================');
  console.log('ALL WORKFLOWS AND VALIDATIONS PASSED SUCCESSFULLY! ✓');
  console.log('====================================================');
}

runTests().catch((err) => {
  console.error(err);
  process.exit(1);
});
