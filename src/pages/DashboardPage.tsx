import { useMemo, useState } from 'react';
import {
  BookPlus,
  Pencil,
  Trash2,
  RotateCcw,
  Search,
  CheckCircle2,
  XCircle,
  BookOpen,
  MapPin,
  Library,
  ArrowUpDown,
  Clock,
  Hash,
  Layers as LayersIcon,
  Plus,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import BookFormModal from '../components/BookFormModal';
import type { Book, Rack, Section, ShelfModel } from '../types';
import { sectionName } from '../location';

type Props = {
  books: Book[];
  sections: Section[];
  racks: Rack[];
  shelves: ShelfModel[];
  mappedRackIds: Set<string>;
  mappedShelfIds: Set<string>;
  onAdd: (book: Omit<Book, 'id' | 'createdAt'>) => void;
  onUpdate: (id: string, patch: Partial<Book>) => void;
  onDelete: (id: string) => void;
  onReset: () => void;
  onNavigateMap: () => void;
  onAddRack?: (rack: Omit<Rack, 'id'> & { id?: string }) => void;
  onUpdateRack?: (id: string, patch: Partial<Rack>) => void;
  onDeleteRack?: (id: string) => void;
};

type SortKey = 'title' | 'rack' | 'category' | 'available' | 'isbn';
type ActiveTab = 'books' | 'racks';

export default function DashboardPage({
  books,
  sections,
  racks,
  shelves,
  mappedRackIds,
  mappedShelfIds,
  onAdd,
  onUpdate,
  onDelete,
  onReset,
  onNavigateMap,
  onAddRack,
  onUpdateRack,
  onDeleteRack,
}: Props) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('books');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Book | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Book | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [query, setQuery] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('title');
  const [sortAsc, setSortAsc] = useState(true);

  // Rack management state
  const [rackModalOpen, setRackModalOpen] = useState(false);
  const [editingRack, setEditingRack] = useState<Rack | null>(null);
  const [confirmDeleteRack, setConfirmDeleteRack] = useState<Rack | null>(null);

  const stats = useMemo(() => {
    const total = books.length;
    const available = books.filter((b) => b.available).length;
    const unavailable = total - available;
    const totalRacks = racks.length;
    const totalShelves = shelves.length;
    const mappedShelves = mappedShelfIds.size;
    return { total, available, unavailable, racks: totalRacks, shelves: totalShelves, mappedShelves };
  }, [books, racks, shelves, mappedShelfIds]);

  const recentlyAdded = useMemo(
    () => [...books].sort((a, b) => b.createdAt - a.createdAt).slice(0, 5),
    [books]
  );

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? books.filter(
          (b) =>
            b.title.toLowerCase().includes(q) ||
            b.author.toLowerCase().includes(q) ||
            b.category.toLowerCase().includes(q) ||
            b.rackId.toLowerCase().includes(q) ||
            b.shelfId.toLowerCase().includes(q) ||
            b.isbn.toLowerCase().includes(q)
        )
      : [...books];

    list.sort((a, b) => {
      let cmp = 0;
      if (sortKey === 'available') {
        cmp = Number(a.available) - Number(b.available);
      } else if (sortKey === 'rack') {
        cmp = a.rackId.localeCompare(b.rackId) || a.shelfNumber - b.shelfNumber;
      } else {
        cmp = String(a[sortKey]).localeCompare(String(b[sortKey]));
      }
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [books, query, sortKey, sortAsc]);

  const toggleSort = (key: SortKey) => {
    if (sortKey === key) setSortAsc((v) => !v);
    else {
      setSortKey(key);
      setSortAsc(true);
    }
  };

  const openAdd = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (book: Book) => {
    setEditing(book);
    setModalOpen(true);
  };

  const handleSave = (data: Omit<Book, 'id' | 'createdAt'>) => {
    if (editing) onUpdate(editing.id, data);
    else onAdd(data);
    setModalOpen(false);
    setEditing(null);
  };

  const openAddRack = () => {
    setEditingRack(null);
    setRackModalOpen(true);
  };

  const openEditRack = (rack: Rack) => {
    setEditingRack(rack);
    setRackModalOpen(true);
  };

  const handleSaveRack = (rackData: {
    id: string;
    sectionId: string;
    rackName: string;
    numberOfShelves: number;
  }) => {
    if (editingRack) {
      onUpdateRack?.(editingRack.id, {
        sectionId: rackData.sectionId,
        rackName: rackData.rackName,
        numberOfShelves: rackData.numberOfShelves,
      });
    } else {
      onAddRack?.({
        id: rackData.id,
        sectionId: rackData.sectionId,
        rackName: rackData.rackName,
        numberOfShelves: rackData.numberOfShelves,
        gridX: 0,
        gridY: 0,
      });
    }
    setRackModalOpen(false);
    setEditingRack(null);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-10 py-8 sm:py-10">
      <PageHeader
        title="Librarian Dashboard"
        subtitle="Manage the full inventory — add, edit, delete books, racks and shelves."
        actions={
          <>
            <button
              onClick={() => setConfirmReset(true)}
              className="px-4 py-2.5 rounded-lg border border-navy-200 text-navy-600 font-medium text-sm hover:bg-navy-50 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset demo
            </button>
            {activeTab === 'books' ? (
              <button
                onClick={openAdd}
                className="px-4 py-2.5 rounded-lg bg-cyan-500 text-white font-semibold text-sm hover:bg-cyan-600 transition-colors flex items-center gap-2 shadow-sm"
              >
                <BookPlus className="w-4 h-4" />
                Add book
              </button>
            ) : (
              <button
                onClick={openAddRack}
                className="px-4 py-2.5 rounded-lg bg-cyan-500 text-white font-semibold text-sm hover:bg-cyan-600 transition-colors flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Add rack
              </button>
            )}
          </>
        }
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={Library} label="Total books" value={stats.total} accent="bg-navy-900" />
        <StatCard icon={MapPin} label="Total racks" value={stats.racks} accent="bg-navy-700" />
        <StatCard icon={LayersIcon} label="Total shelves" value={stats.shelves} accent="bg-cyan-600" />
        <StatCard icon={CheckCircle2} label="Available" value={stats.available} accent="bg-green-600" />
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 mb-6 border-b border-navy-100">
        <button
          onClick={() => setActiveTab('books')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'books'
              ? 'border-cyan-500 text-cyan-700'
              : 'border-transparent text-navy-500 hover:text-navy-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Book Inventory ({books.length})
        </button>
        <button
          onClick={() => setActiveTab('racks')}
          className={`pb-3 px-4 text-sm font-semibold border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'racks'
              ? 'border-cyan-500 text-cyan-700'
              : 'border-transparent text-navy-500 hover:text-navy-800'
          }`}
        >
          <MapPin className="w-4 h-4" />
          Racks & Shelves ({racks.length} racks · {shelves.length} shelves)
        </button>
      </div>

      {activeTab === 'books' ? (
        <>
          <div className="grid lg:grid-cols-3 gap-6 mb-8">
            {/* Recently added */}
            <div className="lg:col-span-1 bg-white rounded-2xl border border-navy-100 shadow-sm p-6">
              <h3 className="font-display font-bold text-lg text-navy-900 flex items-center gap-2 mb-4">
                <Clock className="w-5 h-5 text-cyan-600" />
                Recently added
              </h3>
              <div className="space-y-3">
                {recentlyAdded.map((b) => (
                  <div key={b.id} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-navy-50 flex items-center justify-center shrink-0">
                      <BookOpen className="w-4 h-4 text-navy-500" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-navy-900 truncate">
                        {b.title}
                      </p>
                      <p className="text-xs text-navy-400">
                        {new Date(b.createdAt).toLocaleDateString()} · Rack {b.rackId} · Shelf {b.shelfNumber}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Inventory table */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-navy-100 shadow-sm overflow-hidden">
              <div className="p-4 sm:p-5 border-b border-navy-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h3 className="font-display font-bold text-lg text-navy-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-cyan-600" />
                  Inventory
                </h3>
                <div className="flex items-center gap-2 bg-navy-50 rounded-lg px-3 py-2 w-full sm:w-64">
                  <Search className="w-4 h-4 text-navy-400 shrink-0" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Filter inventory…"
                    className="flex-1 bg-transparent outline-none text-sm text-navy-900 placeholder-navy-400"
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-navy-50 text-navy-500 text-xs uppercase tracking-wide">
                      <Th onClick={() => toggleSort('title')} active={sortKey === 'title'} asc={sortAsc}>
                        Title
                      </Th>
                      <Th onClick={() => toggleSort('rack')} active={sortKey === 'rack'} asc={sortAsc}>
                        Location
                      </Th>
                      <th className="text-left font-semibold px-4 py-3 hidden md:table-cell">
                        Author
                      </th>
                      <th className="text-left font-semibold px-4 py-3 hidden lg:table-cell">
                        <span className="inline-flex items-center gap-1">
                          <Hash className="w-3 h-3" />
                          ISBN
                        </span>
                      </th>
                      <Th onClick={() => toggleSort('available')} active={sortKey === 'available'} asc={sortAsc}>
                        Status
                      </Th>
                      <th className="text-right font-semibold px-4 py-3">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-navy-100">
                    {rows.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-4 py-12 text-center text-navy-400">
                          No books match the filter.
                        </td>
                      </tr>
                    ) : (
                      rows.map((book) => {
                        const mapped = mappedRackIds.has(book.rackId);
                        return (
                          <tr key={book.id} className="hover:bg-navy-50/60 transition-colors">
                            <td className="px-4 py-3 font-medium text-navy-900">
                              {book.title}
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-mono font-semibold text-xs ${
                                  mapped
                                    ? 'bg-cyan-50 text-cyan-700'
                                    : 'bg-amber-50 text-amber-700'
                                }`}
                              >
                                <MapPin className="w-3 h-3" />
                                {book.rackId} · S{book.shelfNumber}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-navy-600 hidden md:table-cell">
                              {book.author}
                            </td>
                            <td className="px-4 py-3 text-navy-500 hidden lg:table-cell font-mono text-xs">
                              {book.isbn || '—'}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {book.available ? (
                                <span className="inline-flex items-center gap-1 text-green-600 text-xs font-semibold">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  Available
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-red-500 text-xs font-semibold">
                                  <XCircle className="w-3.5 h-3.5" />
                                  Out
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center justify-end gap-1">
                                <button
                                  onClick={() => openEdit(book)}
                                  className="p-2 rounded-lg text-navy-500 hover:bg-cyan-50 hover:text-cyan-600 transition-colors"
                                  aria-label="Edit"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => setConfirmDelete(book)}
                                  className="p-2 rounded-lg text-navy-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                                  aria-label="Delete"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="px-4 sm:px-5 py-3 border-t border-navy-100 text-xs text-navy-400 flex items-center justify-between">
                <span>
                  {rows.length} of {books.length} books
                </span>
                <span>Saved to your browser automatically</span>
              </div>
            </div>
          </div>

          {/* Orphaned rack warning */}
          {(() => {
            const orphans = books.filter((b) => !mappedRackIds.has(b.rackId));
            if (orphans.length === 0) return null;
            const uniqueOrphanRacks = Array.from(new Set(orphans.map((b) => b.rackId)));
            return (
              <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                    <MapPin className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h4 className="font-display font-bold text-amber-800">
                      {orphans.length} book{orphans.length > 1 ? 's' : ''} on racks missing from the map
                    </h4>
                    <p className="text-amber-700 text-sm mt-0.5">
                      Racks: {uniqueOrphanRacks.join(', ')} — add these racks in the Map Editor so students can navigate to them.
                    </p>
                  </div>
                </div>
                <button
                  onClick={onNavigateMap}
                  className="px-4 py-2.5 rounded-lg bg-amber-600 text-white font-semibold text-sm hover:bg-amber-700 transition-colors whitespace-nowrap"
                >
                  Open Map Editor
                </button>
              </div>
            );
          })()}
        </>
      ) : (
        /* Racks & Shelves Management Tab */
        <div className="bg-white rounded-2xl border border-navy-100 shadow-sm overflow-hidden mb-8">
          <div className="p-4 sm:p-5 border-b border-navy-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-display font-bold text-lg text-navy-900 flex items-center gap-2">
                <MapPin className="w-5 h-5 text-cyan-600" />
                Racks & Shelf Capacity
              </h3>
              <p className="text-xs text-navy-500 mt-0.5">
                Each rack contains multiple numbered shelves. Add, rename, or adjust shelves per rack.
              </p>
            </div>
            <button
              onClick={openAddRack}
              className="px-4 py-2 rounded-lg bg-cyan-500 text-white font-semibold text-sm hover:bg-cyan-600 transition-colors flex items-center gap-1.5 self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Add new rack
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-navy-50 text-navy-500 text-xs uppercase tracking-wide">
                  <th className="text-left font-semibold px-4 py-3">Rack ID</th>
                  <th className="text-left font-semibold px-4 py-3">Rack Name</th>
                  <th className="text-left font-semibold px-4 py-3">Section</th>
                  <th className="text-left font-semibold px-4 py-3">Shelves</th>
                  <th className="text-left font-semibold px-4 py-3">Books Stored</th>
                  <th className="text-left font-semibold px-4 py-3">Map Status</th>
                  <th className="text-right font-semibold px-4 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-navy-100">
                {racks.map((rack) => {
                  const sec = sectionName(sections, rack.sectionId);
                  const rackShelves = shelves.filter((s) => s.rackId === rack.id);
                  const rackBooks = books.filter((b) => b.rackId === rack.id);
                  const isMapped = mappedRackIds.has(rack.id);

                  return (
                    <tr key={rack.id} className="hover:bg-navy-50/60 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-navy-900">
                        {rack.id}
                      </td>
                      <td className="px-4 py-3 font-medium text-navy-800">
                        {rack.rackName}
                      </td>
                      <td className="px-4 py-3 text-navy-600">
                        {sec}
                      </td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-navy-100 text-navy-700 text-xs font-semibold">
                          {rackShelves.length || rack.numberOfShelves} shelves
                        </span>
                      </td>
                      <td className="px-4 py-3 text-navy-600">
                        {rackBooks.length} book{rackBooks.length === 1 ? '' : 's'}
                      </td>
                      <td className="px-4 py-3">
                        {isMapped ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-green-50 text-green-700 text-xs font-semibold">
                            <CheckCircle2 className="w-3 h-3" />
                            On Floor Map ({rack.gridX}, {rack.gridY})
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 text-amber-700 text-xs font-semibold">
                            Not Placed
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => openEditRack(rack)}
                            className="p-2 rounded-lg text-navy-500 hover:bg-cyan-50 hover:text-cyan-600 transition-colors"
                            aria-label="Edit rack"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setConfirmDeleteRack(rack)}
                            className="p-2 rounded-lg text-navy-500 hover:bg-red-50 hover:text-red-600 transition-colors"
                            aria-label="Delete rack"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Book Form Modal */}
      {modalOpen && (
        <BookFormModal
          initial={editing}
          onSave={handleSave}
          onClose={() => {
            setModalOpen(false);
            setEditing(null);
          }}
          sections={sections}
          racks={racks}
          shelves={shelves}
        />
      )}

      {/* Rack Form Modal */}
      {rackModalOpen && (
        <RackModal
          initial={editingRack}
          sections={sections}
          existingRacks={racks}
          onSave={handleSaveRack}
          onClose={() => {
            setRackModalOpen(false);
            setEditingRack(null);
          }}
        />
      )}

      {/* Confirm Delete Book */}
      {confirmDelete && (
        <ConfirmDialog
          title="Delete book?"
          message={`“${confirmDelete.title}” will be removed from the inventory. This cannot be undone.`}
          confirmLabel="Delete"
          danger
          onConfirm={() => {
            onDelete(confirmDelete.id);
            setConfirmDelete(null);
          }}
          onClose={() => setConfirmDelete(null)}
        />
      )}

      {/* Confirm Delete Rack */}
      {confirmDeleteRack && (
        <ConfirmDialog
          title="Delete rack?"
          message={`Rack “${confirmDeleteRack.id} — ${confirmDeleteRack.rackName}” and its associated shelves and books will be removed.`}
          confirmLabel="Delete Rack"
          danger
          onConfirm={() => {
            onDeleteRack?.(confirmDeleteRack.id);
            setConfirmDeleteRack(null);
          }}
          onClose={() => setConfirmDeleteRack(null)}
        />
      )}

      {/* Confirm Reset Demo */}
      {confirmReset && (
        <ConfirmDialog
          title="Reset demo data?"
          message="This restores the original sample books, racks and shelves and discards your changes."
          confirmLabel="Reset"
          onConfirm={() => {
            onReset();
            setConfirmReset(false);
          }}
          onClose={() => setConfirmReset(false)}
        />
      )}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: typeof Library;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-navy-100 shadow-sm p-5 flex items-center gap-4">
      <div
        className={`w-12 h-12 rounded-xl ${accent} flex items-center justify-center shrink-0`}
      >
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div className="min-w-0">
        <div className="font-display font-extrabold text-2xl text-navy-900">
          {value}
        </div>
        <div className="text-navy-500 text-xs sm:text-sm truncate">{label}</div>
      </div>
    </div>
  );
}

function Th({
  children,
  onClick,
  active,
  asc,
}: {
  children: React.ReactNode;
  onClick: () => void;
  active: boolean;
  asc: boolean;
}) {
  return (
    <th className="text-left font-semibold px-4 py-3">
      <button
        onClick={onClick}
        className={`inline-flex items-center gap-1 hover:text-navy-800 transition-colors ${
          active ? 'text-navy-900' : ''
        }`}
      >
        {children}
        <ArrowUpDown
          className={`w-3 h-3 ${active ? (asc ? '' : 'rotate-180') : 'opacity-40'}`}
        />
      </button>
    </th>
  );
}

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  danger,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 animate-fade-in">
        <h3 className="font-display font-bold text-lg text-navy-900">{title}</h3>
        <p className="text-navy-500 text-sm mt-2">{message}</p>
        <div className="flex items-center justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-navy-600 font-medium hover:bg-navy-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`px-4 py-2 rounded-lg text-white font-semibold transition-colors ${
              danger
                ? 'bg-red-500 hover:bg-red-600'
                : 'bg-cyan-500 hover:bg-cyan-600'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

function RackModal({
  initial,
  sections,
  existingRacks,
  onSave,
  onClose,
}: {
  initial: Rack | null;
  sections: Section[];
  existingRacks: Rack[];
  onSave: (data: {
    id: string;
    sectionId: string;
    rackName: string;
    numberOfShelves: number;
  }) => void;
  onClose: () => void;
}) {
  const [rackId, setRackId] = useState(initial ? initial.id : '');
  const [sectionId, setSectionId] = useState(
    initial ? initial.sectionId : sections[0]?.id ?? 'sec-a'
  );
  const [rackNameVal, setRackNameVal] = useState(
    initial ? initial.rackName : ''
  );
  const [numberOfShelves, setNumberOfShelves] = useState(
    initial ? initial.numberOfShelves : 5
  );
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = rackId.trim().toUpperCase();
    if (!cleanId) {
      setError('Rack ID is required.');
      return;
    }
    if (!initial && existingRacks.some((r) => r.id === cleanId)) {
      setError('A rack with this ID already exists.');
      return;
    }
    const cleanName = rackNameVal.trim() || `Rack ${cleanId}`;
    onSave({
      id: cleanId,
      sectionId,
      rackName: cleanName,
      numberOfShelves: Math.max(1, Math.min(20, numberOfShelves)),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-fade-in">
        <h3 className="font-display font-bold text-lg text-navy-900 mb-4">
          {initial ? `Edit Rack ${initial.id}` : 'Add New Rack'}
        </h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-navy-500 mb-1">
              Rack ID *
            </label>
            <input
              required
              disabled={Boolean(initial)}
              value={rackId}
              onChange={(e) => {
                setRackId(e.target.value);
                setError(null);
              }}
              className="w-full px-3.5 py-2.5 rounded-lg border border-navy-200 text-navy-900 placeholder-navy-400 bg-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all text-sm disabled:bg-navy-50 disabled:text-navy-500"
              placeholder="e.g. A-05 or E-01"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-navy-500 mb-1">
              Section *
            </label>
            <select
              value={sectionId}
              onChange={(e) => setSectionId(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-navy-200 text-navy-900 bg-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all text-sm"
            >
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-navy-500 mb-1">
              Rack Name / Bay
            </label>
            <input
              value={rackNameVal}
              onChange={(e) => setRackNameVal(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-lg border border-navy-200 text-navy-900 placeholder-navy-400 bg-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all text-sm"
              placeholder="e.g. Engineering Bay 5"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-navy-500 mb-1">
              Number of Shelves (1 - 20)
            </label>
            <input
              type="number"
              min={1}
              max={20}
              value={numberOfShelves}
              onChange={(e) => setNumberOfShelves(Number(e.target.value))}
              className="w-full px-3.5 py-2.5 rounded-lg border border-navy-200 text-navy-900 bg-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all text-sm"
            />
          </div>

          {error && (
            <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-lg">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-navy-600 font-medium hover:bg-navy-50 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-cyan-500 text-white font-semibold hover:bg-cyan-600 transition-colors text-sm"
            >
              {initial ? 'Save Changes' : 'Create Rack'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
