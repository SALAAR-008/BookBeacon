import type { Book, Rack, Section, ShelfModel } from './types';

export function sectionName(sections: Section[], sectionId: string): string {
  return sections.find((s) => s.id === sectionId)?.name ?? 'Unknown Section';
}

export function sectionCode(sections: Section[], sectionId: string): string {
  return sections.find((s) => s.id === sectionId)?.code ?? '?';
}

export function rackName(racks: Rack[], rackId: string): string {
  return racks.find((r) => r.id === rackId)?.rackName ?? rackId;
}

export function rackById(racks: Rack[], rackId: string): Rack | undefined {
  return racks.find((r) => r.id === rackId);
}

export function shelfById(shelves: ShelfModel[], shelfId: string): ShelfModel | undefined {
  return shelves.find((s) => s.id === shelfId);
}

export function shelvesForRack(shelves: ShelfModel[], rackId: string): ShelfModel[] {
  return shelves
    .filter((s) => s.rackId === rackId)
    .sort((a, b) => a.shelfNumber - b.shelfNumber);
}

export function racksForSection(racks: Rack[], sectionId: string): Rack[] {
  return racks.filter((r) => r.sectionId === sectionId);
}

export function booksForRack(books: Book[], rackId: string): Book[] {
  return books.filter((b) => b.rackId === rackId);
}

export function booksForSection(books: Book[], sectionId: string): Book[] {
  return books.filter((b) => b.sectionId === sectionId);
}

export function booksForShelf(books: Book[], shelfId: string): Book[] {
  return books.filter((b) => b.shelfId === shelfId);
}

// Full location string: "Section A → Rack A-03 → Shelf 2"
export function fullLocation(
  sections: Section[],
  racks: Rack[],
  book: { sectionId: string; rackId: string; shelfNumber: number }
): string {
  const sec = sectionName(sections, book.sectionId);
  return `${sec} → Rack ${book.rackId} → Shelf ${book.shelfNumber}`;
}

// Short location: "A-03 · Shelf 2"
export function shortLocation(book: { rackId: string; shelfNumber: number }): string {
  return `${book.rackId} · Shelf ${book.shelfNumber}`;
}

// Validate that a book's references still exist
export function isBookLocationValid(
  book: Book,
  sections: Section[],
  racks: Rack[],
  shelves: ShelfModel[]
): boolean {
  return (
    sections.some((s) => s.id === book.sectionId) &&
    racks.some((r) => r.id === book.rackId) &&
    shelves.some((s) => s.id === book.shelfId)
  );
}
