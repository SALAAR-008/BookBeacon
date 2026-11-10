export type Role = 'student' | 'librarian';

export type User = {
  id: string;
  name: string;
  email: string;
  role: Role;
};

export type Section = {
  id: string;          // e.g. "sec-a"
  name: string;        // e.g. "Section A"
  code: string;        // e.g. "A"
  description: string;
};

export type Rack = {
  id: string;          // rack_id e.g. "A-03"
  sectionId: string;   // references Section.id
  rackName: string;    // display name e.g. "Engineering Bay 2"
  numberOfShelves: number;
  gridX: number;       // map coordinate
  gridY: number;
};

export type ShelfModel = {
  id: string;          // shelf_id e.g. "A-03-2"
  rackId: string;      // references Rack.id
  shelfNumber: number; // 1, 2, 3...
};

export type Book = {
  id: string;
  title: string;
  author: string;
  sectionId: string;
  rackId: string;
  shelfId: string;
  shelfNumber: number;
  isbn: string;
  category: string;
  description: string;
  available: boolean;
  copies: number;
  createdAt: number;
};

export type CellType = 'empty' | 'rack' | 'entrance' | 'pathway' | 'blocked';

export type MapCell = {
  id: string;
  type: CellType;
  gridX: number;
  gridY: number;
  rackId?: string;
};

export type LibraryMap = {
  entrance: { gridX: number; gridY: number };
  cells: MapCell[];
};

export type PageId =
  | 'home'
  | 'search'
  | 'details'
  | 'navigation'
  | 'dashboard'
  | 'mapeditor'
  | 'login';

export type ShelfCoord = {
  rackId: string;
  x: number;
  y: number;
};
