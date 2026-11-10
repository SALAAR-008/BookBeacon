import { useMemo, useState, type FormEvent } from 'react';
import { X, BookPlus } from 'lucide-react';
import type { Book, Rack, Section, ShelfModel } from '../types';
import { shelvesForRack, racksForSection } from '../location';

type Props = {
  initial?: Book | null;
  onSave: (data: Omit<Book, 'id' | 'createdAt'>) => void;
  onClose: () => void;
  sections: Section[];
  racks: Rack[];
  shelves: ShelfModel[];
};

export default function BookFormModal({
  initial,
  onSave,
  onClose,
  sections,
  racks,
  shelves,
}: Props) {
  const [form, setForm] = useState<Omit<Book, 'id' | 'createdAt'>>(() => {
    if (initial) {
      return { ...initial };
    }
    const defaultSecId = sections[0]?.id ?? '';
    const initialRacks = racksForSection(racks, defaultSecId);
    const defaultRack = initialRacks[0] ?? racks[0];
    const defaultRackId = defaultRack?.id ?? '';
    const initialShelves = shelvesForRack(shelves, defaultRackId);
    const defaultShelf = initialShelves[0];
    return {
      title: '',
      author: '',
      sectionId: defaultSecId,
      rackId: defaultRackId,
      shelfId: defaultShelf?.id ?? (defaultRackId ? `${defaultRackId}-1` : ''),
      shelfNumber: defaultShelf?.shelfNumber ?? 1,
      isbn: '',
      category: '',
      available: true,
      copies: 1,
      description: '',
    };
  });

  const set = <K extends keyof Omit<Book, 'id' | 'createdAt'>>(
    key: K,
    value: Omit<Book, 'id' | 'createdAt'>[K]
  ) => setForm((f) => ({ ...f, [key]: value }));

  const availableRacks = useMemo(
    () => racksForSection(racks, form.sectionId),
    [racks, form.sectionId]
  );

  const availableShelves = useMemo(
    () => shelvesForRack(shelves, form.rackId),
    [shelves, form.rackId]
  );

  // when section changes, reset rack/shelf
  const onSectionChange = (sectionId: string) => {
    const firstRack = racksForSection(racks, sectionId)[0];
    const firstShelf = firstRack
      ? shelvesForRack(shelves, firstRack.id)[0]
      : undefined;
    setForm((f) => ({
      ...f,
      sectionId,
      rackId: firstRack?.id ?? '',
      shelfId: firstShelf?.id ?? '',
      shelfNumber: firstShelf?.shelfNumber ?? 1,
    }));
  };

  const onRackChange = (rackId: string) => {
    const firstShelf = shelvesForRack(shelves, rackId)[0];
    setForm((f) => ({
      ...f,
      rackId,
      shelfId: firstShelf?.id ?? '',
      shelfNumber: firstShelf?.shelfNumber ?? 1,
    }));
  };

  const onShelfChange = (shelfId: string) => {
    const shelf = shelves.find((s) => s.id === shelfId);
    setForm((f) => ({ ...f, shelfId, shelfNumber: shelf?.shelfNumber ?? 1 }));
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!form.title.trim() || !form.rackId) return;
    onSave({
      ...form,
      title: form.title.trim(),
      author: form.author.trim() || 'Unknown',
      isbn: form.isbn.trim(),
      category: form.category.trim() || 'General',
      copies: Math.max(1, Number(form.copies) || 1),
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-navy-950/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-in">
        <div className="flex items-center justify-between px-6 py-4 border-b border-navy-100 sticky top-0 bg-white rounded-t-2xl z-10">
          <h3 className="font-display font-bold text-lg text-navy-900 flex items-center gap-2">
            <BookPlus className="w-5 h-5 text-cyan-600" />
            {initial ? 'Edit book' : 'Add new book'}
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-navy-50 text-navy-500"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={submit} className="p-6 space-y-4">
          <Field label="Title" required>
            <input
              required
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              className={inputCls}
              placeholder="e.g. Engineering Mathematics"
            />
          </Field>

          {/* Hierarchical location selector */}
          <div className="rounded-xl border border-navy-100 bg-navy-50/40 p-4 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-navy-500">
              Library Location
            </p>
            <Field label="Section" required>
              <select
                value={form.sectionId}
                onChange={(e) => onSectionChange(e.target.value)}
                className={inputCls}
              >
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code})
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Rack / Bookshelf" required>
              <select
                value={form.rackId}
                onChange={(e) => onRackChange(e.target.value)}
                className={inputCls}
                disabled={availableRacks.length === 0}
              >
                {availableRacks.length === 0 && (
                  <option value="">No racks in this section</option>
                )}
                {availableRacks.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.id} — {r.rackName}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Shelf" required>
              <select
                value={form.shelfId}
                onChange={(e) => onShelfChange(e.target.value)}
                className={inputCls}
                disabled={availableShelves.length === 0}
              >
                {availableShelves.length === 0 && (
                  <option value="">No shelves in this rack</option>
                )}
                {availableShelves.map((s) => (
                  <option key={s.id} value={s.id}>
                    Shelf {s.shelfNumber}
                  </option>
                ))}
              </select>
            </Field>

            {form.rackId && form.shelfNumber && (
              <div className="text-xs text-cyan-700 bg-cyan-50 rounded-lg px-3 py-2 font-medium">
                Full location: Section {sections.find((s) => s.id === form.sectionId)?.code} → Rack {form.rackId} → Shelf {form.shelfNumber}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Author">
              <input
                value={form.author}
                onChange={(e) => set('author', e.target.value)}
                className={inputCls}
                placeholder="Author name"
              />
            </Field>
            <Field label="ISBN">
              <input
                value={form.isbn}
                onChange={(e) => set('isbn', e.target.value)}
                className={inputCls}
                placeholder="978-…"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Category / Subject">
              <input
                value={form.category}
                onChange={(e) => set('category', e.target.value)}
                className={inputCls}
                placeholder="e.g. Engineering"
              />
            </Field>
            <Field label="Quantity">
              <input
                type="number"
                min={1}
                value={form.copies}
                onChange={(e) => set('copies', Number(e.target.value))}
                className={inputCls}
              />
            </Field>
          </div>

          <Field label="Description">
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={3}
              className={`${inputCls} resize-none`}
              placeholder="Short summary of the book"
            />
          </Field>

          <Field label="Availability">
            <label className="flex items-center gap-3 cursor-pointer">
              <button
                type="button"
                onClick={() => set('available', !form.available)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  form.available ? 'bg-cyan-500' : 'bg-navy-200'
                }`}
              >
                <span
                  className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                    form.available ? 'translate-x-6' : ''
                  }`}
                />
              </button>
              <span className="text-sm text-navy-700">
                {form.available ? 'Available' : 'Checked out'}
              </span>
            </label>
          </Field>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-lg text-navy-600 font-medium hover:bg-navy-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-lg bg-cyan-500 text-white font-semibold hover:bg-cyan-600 transition-colors"
            >
              {initial ? 'Save changes' : 'Add book'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const inputCls =
  'w-full px-3.5 py-2.5 rounded-lg border border-navy-200 text-navy-900 placeholder-navy-400 bg-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all text-sm';

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-xs font-semibold uppercase tracking-wide text-navy-500 mb-1.5">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </span>
      {children}
    </label>
  );
}
