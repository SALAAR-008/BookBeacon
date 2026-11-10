import {
  ArrowLeft,
  MapPin,
  Navigation,
  BookMarked,
  User,
  Tag,
  Layers,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Hash,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import type { Book, PageId, Rack, Section } from '../types';
import { sectionName, rackName } from '../location';

type Props = {
  book: Book | null;
  sections: Section[];
  racks: Rack[];
  mappedRackIds: Set<string>;
  onNavigate: (page: PageId) => void;
  onNavigateToShelf: (rackId: string, book?: Book) => void;
};

export default function DetailsPage({
  book,
  sections,
  racks,
  mappedRackIds,
  onNavigate,
  onNavigateToShelf,
}: Props) {
  if (!book) {
    return (
      <div className="max-w-4xl mx-auto px-6 sm:px-10 py-16 text-center">
        <p className="text-navy-500">No book selected. Search for one first.</p>
        <button
          onClick={() => onNavigate('search')}
          className="mt-4 px-5 py-2.5 rounded-lg bg-navy-900 text-white font-semibold hover:bg-navy-800 transition-colors"
        >
          Go to Book Search
        </button>
      </div>
    );
  }

  const mapped = mappedRackIds.has(book.rackId);
  const sec = sectionName(sections, book.sectionId);
  const rName = rackName(racks, book.rackId);

  return (
    <div className="max-w-5xl mx-auto px-6 sm:px-10 py-8 sm:py-10">
      <button
        onClick={() => onNavigate('search')}
        className="flex items-center gap-2 text-navy-500 hover:text-navy-900 font-medium text-sm mb-6 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to search
      </button>

      <PageHeader title="Book Details" subtitle="Availability and shelf location." />

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main card */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-navy-100 shadow-sm p-7 animate-fade-in">
          <div className="flex items-start gap-5">
            <div className="w-20 h-24 rounded-xl bg-gradient-to-br from-navy-800 to-navy-950 flex items-center justify-center shrink-0 shadow-lg">
              <BookMarked className="w-10 h-10 text-cyan-400" />
            </div>
            <div className="min-w-0">
              <h2 className="font-display font-extrabold text-2xl text-navy-900 leading-tight">
                {book.title}
              </h2>
              <p className="text-navy-500 mt-1">by {book.author}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cyan-50 text-cyan-700 text-xs font-semibold">
                  <Tag className="w-3.5 h-3.5" />
                  {book.category}
                </span>
                <span
                  className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                    book.available
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-600'
                  }`}
                >
                  {book.available ? (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5" />
                  )}
                  {book.available ? 'Available' : 'Currently checked out'}
                </span>
              </div>
            </div>
          </div>

          <p className="text-navy-600 leading-relaxed mt-6">{book.description}</p>

          <div className="grid grid-cols-2 gap-4 mt-7">
            <InfoTile
              icon={MapPin}
              label="Location"
              value={`Rack ${book.rackId} · Shelf ${book.shelfNumber}`}
            />
            <InfoTile
              icon={Layers}
              label="Copies"
              value={`${book.copies} ${book.copies === 1 ? 'copy' : 'copies'}`}
            />
          </div>
        </div>

        {/* Side panel */}
        <div className="space-y-5">
          <div className="bg-gradient-to-br from-navy-900 to-navy-950 text-white rounded-2xl p-6 shadow-lg animate-fade-in">
            <div className="flex items-center gap-2 text-cyan-400 mb-3">
              <MapPin className="w-5 h-5" />
              <span className="font-semibold text-sm uppercase tracking-wide">
                Location
              </span>
            </div>
            <div className="font-display font-extrabold text-3xl">
              {book.rackId} · Shelf {book.shelfNumber}
            </div>
            <p className="text-navy-300 text-sm mt-2">
              {sec} — {rName}.
            </p>

            {mapped ? (
              <button
                onClick={() => onNavigateToShelf(book.rackId, book)}
                className="mt-6 w-full px-5 py-3 rounded-xl bg-cyan-400 text-navy-900 font-semibold hover:bg-cyan-300 transition-colors flex items-center justify-center gap-2"
              >
                <Navigation className="w-5 h-5" />
                Navigate to Book
              </button>
            ) : (
              <div className="mt-6 rounded-xl bg-amber-500/15 border border-amber-400/30 p-3">
                <p className="flex items-center gap-2 text-amber-300 text-sm font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  Rack not on map
                </p>
                <p className="text-navy-300 text-xs mt-1">
                  A librarian needs to add rack {book.rackId} in the Map Editor
                  before navigation is available.
                </p>
              </div>
            )}
          </div>

          <div className="bg-white rounded-2xl border border-navy-100 p-6">
            <h4 className="font-display font-bold text-navy-900 mb-3">
              Quick facts
            </h4>
            <dl className="space-y-2.5 text-sm">
              <Row icon={User} label="Author" value={book.author} />
              <Row icon={Tag} label="Category" value={book.category} />
              <Row icon={Hash} label="ISBN" value={book.isbn || '—'} />
              <Row icon={Layers} label="Copies" value={`${book.copies}`} />
              <Row icon={MapPin} label="Section" value={sec} />
              <Row icon={MapPin} label="Rack" value={`${book.rackId} (${rName})`} />
              <Row icon={MapPin} label="Shelf Tier" value={`Shelf ${book.shelfNumber}`} />
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl bg-navy-50 p-4 border border-navy-100">
      <div className="flex items-center gap-2 text-navy-400 text-xs font-semibold uppercase tracking-wide mb-1">
        <Icon className="w-4 h-4" />
        {label}
      </div>
      <div className="font-display font-bold text-lg text-navy-900">{value}</div>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof MapPin;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="flex items-center gap-2 text-navy-500">
        <Icon className="w-4 h-4 text-navy-400" />
        {label}
      </dt>
      <dd className="font-semibold text-navy-900 text-right">{value}</dd>
    </div>
  );
}
