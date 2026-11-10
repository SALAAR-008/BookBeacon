import type { Book, LibraryMap, Rack, Section, ShelfModel, User } from './types';

export const DEMO_PASSWORD = 'bookbeacon';

export const SEED_USERS: User[] = [
  {
    id: 'u-student',
    name: 'Demo Student',
    email: 'student@bookbeacon.demo',
    role: 'student',
  },
  {
    id: 'u-librarian',
    name: 'Demo Librarian',
    email: 'librarian@bookbeacon.demo',
    role: 'librarian',
  },
];

export const SEED_SECTIONS: Section[] = [
  { id: 'sec-a', name: 'Section A', code: 'A', description: 'Engineering & General Sciences' },
  { id: 'sec-b', name: 'Section B', code: 'B', description: 'Mechanical Engineering' },
  { id: 'sec-c', name: 'Section C', code: 'C', description: 'Computer Science' },
  { id: 'sec-d', name: 'Section D', code: 'D', description: 'Electronics & Control' },
];

// Helper to build shelves for a rack
function shelves(rackId: string, count: number): ShelfModel[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `${rackId}-${i + 1}`,
    rackId,
    shelfNumber: i + 1,
  }));
}

function rack(
  id: string,
  sectionId: string,
  rackName: string,
  numberOfShelves: number,
  gridX: number,
  gridY: number
): Rack {
  return { id, sectionId, rackName, numberOfShelves, gridX, gridY };
}

export const SEED_RACKS: Rack[] = [
  // Section A — Engineering
  rack('A-01', 'sec-a', 'Engineering Bay 1', 5, 1, 0),
  rack('A-03', 'sec-a', 'Engineering Bay 2', 5, 3, 0),
  rack('A-08', 'sec-a', 'Engineering Bay 3', 5, 7, 0),
  rack('A-10', 'sec-a', 'Engineering Bay 4', 4, 9, 0),
  // Section B — Mechanical
  rack('B-02', 'sec-b', 'Mechanical Bay 1', 5, 1, 2),
  rack('B-05', 'sec-b', 'Mechanical Bay 2', 5, 3, 2),
  rack('B-09', 'sec-b', 'Mechanical Bay 3', 5, 7, 2),
  rack('B-11', 'sec-b', 'Mechanical Bay 4', 4, 9, 2),
  // Section C — Computer Science
  rack('C-03', 'sec-c', 'Computer Science 1', 5, 1, 4),
  rack('C-07', 'sec-c', 'Computer Science 2', 5, 3, 4),
  rack('C-11', 'sec-c', 'Computer Science 3', 5, 7, 4),
  rack('C-12', 'sec-c', 'Computer Science 4', 4, 9, 4),
  // Section D — Electronics
  rack('D-04', 'sec-d', 'Electronics 1', 5, 1, 6),
  rack('D-07', 'sec-d', 'Electronics 2', 5, 3, 6),
  rack('D-12', 'sec-d', 'Electronics 3', 5, 7, 6),
  rack('D-14', 'sec-d', 'Electronics 4', 4, 9, 6),
];

export const SEED_SHELVES: ShelfModel[] = SEED_RACKS.flatMap((r) =>
  shelves(r.id, r.numberOfShelves)
);

// Migrate old shelf string (e.g. "A-03") to { sectionId, rackId, shelfNumber }
// We pick shelf 1 by default for existing books — the rack ID matches the old shelf string.
function oldShelfToLocation(oldShelf: string): {
  sectionId: string;
  rackId: string;
  shelfId: string;
  shelfNumber: number;
} {
  const rackId = oldShelf;
  const sectionCode = oldShelf.split('-')[0];
  const sectionId = `sec-${sectionCode.toLowerCase()}`;
  return {
    sectionId,
    rackId,
    shelfId: `${rackId}-1`,
    shelfNumber: 1,
  };
}

export const SEED_BOOKS: Book[] = [
  {
    id: 'b1',
    title: 'Engineering Mathematics',
    author: 'K.A. Stroud',
    isbn: '978-1-35200-000-1',
    category: 'Engineering',
    available: true,
    copies: 4,
    createdAt: Date.UTC(2025, 0, 10),
    description:
      'A comprehensive foundation in engineering mathematics covering calculus, linear algebra, differential equations and numerical methods.',
    ...oldShelfToLocation('A-03'),
  },
  {
    id: 'b2',
    title: 'Data Structures',
    author: 'Mark Allen Weiss',
    isbn: '978-0-13157-000-2',
    category: 'Computer Science',
    available: true,
    copies: 3,
    createdAt: Date.UTC(2025, 1, 14),
    description:
      'Classic algorithms and data structures in C — lists, stacks, queues, trees, graphs, sorting and hashing explained with clarity.',
    ...oldShelfToLocation('C-07'),
  },
  {
    id: 'b3',
    title: 'Digital Electronics',
    author: 'Morris Mano',
    isbn: '978-0-13141-000-3',
    category: 'Electronics',
    available: false,
    copies: 2,
    createdAt: Date.UTC(2025, 2, 3),
    description:
      'Logic gates, combinational and sequential circuits, flip-flops, counters and microprocessor fundamentals.',
    ...oldShelfToLocation('D-12'),
  },
  {
    id: 'b4',
    title: 'Thermodynamics',
    author: 'P.K. Nag',
    isbn: '978-0-07338-000-4',
    category: 'Mechanical',
    available: true,
    copies: 5,
    createdAt: Date.UTC(2025, 3, 20),
    description:
      'First and second laws, entropy, availability, gas and vapour power cycles, refrigeration and thermodynamic relations.',
    ...oldShelfToLocation('B-05'),
  },
  {
    id: 'b5',
    title: 'Operating System Concepts',
    author: 'Silberschatz, Galvin, Gagne',
    isbn: '978-1-11806-000-5',
    category: 'Computer Science',
    available: true,
    copies: 6,
    createdAt: Date.UTC(2025, 4, 1),
    description:
      'Processes, threads, scheduling, memory management, file systems and distributed systems — the standard OS textbook.',
    ...oldShelfToLocation('C-03'),
  },
  {
    id: 'b6',
    title: 'Fluid Mechanics',
    author: 'Frank M. White',
    isbn: '978-0-07339-000-6',
    category: 'Mechanical',
    available: true,
    copies: 3,
    createdAt: Date.UTC(2025, 5, 12),
    description:
      'Properties of fluids, statics, kinematics, control-volume analysis, dimensional analysis and flow in pipes and channels.',
    ...oldShelfToLocation('B-09'),
  },
  {
    id: 'b7',
    title: 'Signals and Systems',
    author: 'Oppenheim, Willsky',
    isbn: '978-0-13214-000-7',
    category: 'Electronics',
    available: true,
    copies: 4,
    createdAt: Date.UTC(2025, 6, 8),
    description:
      'Continuous and discrete-time signals, LTI systems, Fourier analysis, Laplace and Z transforms.',
    ...oldShelfToLocation('D-04'),
  },
  {
    id: 'b8',
    title: 'Strength of Materials',
    author: 'R.K. Bansal',
    isbn: '978-8-19084-000-8',
    category: 'Engineering',
    available: true,
    copies: 5,
    createdAt: Date.UTC(2025, 7, 16),
    description:
      'Stress and strain, beams, torsion, columns, strain energy and theory of elastic failure.',
    ...oldShelfToLocation('A-08'),
  },
  {
    id: 'b9',
    title: 'Database System Concepts',
    author: 'Silberschatz, Korth, Sudarshan',
    isbn: '978-0-07352-000-9',
    category: 'Computer Science',
    available: false,
    copies: 2,
    createdAt: Date.UTC(2025, 8, 22),
    description:
      'Relational model, SQL, transaction management, concurrency control, recovery and distributed databases.',
    ...oldShelfToLocation('C-11'),
  },
  {
    id: 'b10',
    title: 'Engineering Mechanics',
    author: 'J.L. Meriam',
    isbn: '978-1-11901-000-0',
    category: 'Engineering',
    available: true,
    copies: 7,
    createdAt: Date.UTC(2025, 9, 5),
    description:
      'Statics and dynamics of particles and rigid bodies — force systems, equilibrium, kinematics and kinetics.',
    ...oldShelfToLocation('A-01'),
  },
  {
    id: 'b11',
    title: 'Control Systems Engineering',
    author: 'Norman S. Nise',
    isbn: '978-1-11947-000-1',
    category: 'Electronics',
    available: true,
    copies: 3,
    createdAt: Date.UTC(2025, 10, 1),
    description:
      'Modeling, transfer functions, stability, root locus, frequency response and state-space design.',
    ...oldShelfToLocation('D-07'),
  },
  {
    id: 'b12',
    title: 'Heat Transfer',
    author: 'J.P. Holman',
    isbn: '978-0-07359-000-2',
    category: 'Mechanical',
    available: true,
    copies: 4,
    createdAt: Date.UTC(2025, 11, 15),
    description:
      'Conduction, convection and radiation — steady and transient analysis with practical engineering applications.',
    ...oldShelfToLocation('B-02'),
  },
];

// Map is now derived from racks — but kept as a separate stored structure
// so librarians can add pathways, blocked areas, and entrance position.
function rackCell(r: Rack) {
  return {
    id: `cell-${r.id}`,
    type: 'rack' as const,
    gridX: r.gridX,
    gridY: r.gridY,
    rackId: r.id,
  };
}

export const SEED_MAP: LibraryMap = {
  entrance: { gridX: 5, gridY: 8 },
  cells: SEED_RACKS.map(rackCell),
};

export const GRID_COLS = 12;
export const GRID_ROWS = 9;
