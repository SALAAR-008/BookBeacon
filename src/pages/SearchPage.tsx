import { useMemo, useState } from 'react';
import { Search, MapPin, ArrowRight, BookX, BookMarked, ChevronRight } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import type { Book, PageId, Rack, Section } from '../types';
import { sectionCode, rackName } from '../location';

type Props = {
  books: Book[];
  mappedRackIds: Set<string>;
  sections: Section[];
  racks: Rack[];
  initialQuery: string;
  onQueryChange: (q: string) => void;
  onSelectBook: (book: Book) => void;
  onNavigate: (page: PageId) => void;
};

export default function SearchPage({
  books,
  mappedRackIds,
  sections,
  racks,
  initialQuery,
  onQueryChange,
  onSelectBook,
  onNavigate,
}: Props) {
  const [query, setQuery] = useState(initialQuery);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return books;
    return books.filter(
      (b) =>
        b.title.toLowerCase().includes(q) ||
        b.author.toLowerCase().includes(q) ||
        b.category.toLowerCase().includes(q) ||
        b.rackId.toLowerCase().includes(q) ||
        b.isbn.toLowerCase().includes(q)
    );
  }, [query, books]);

  const update = (v: string) => {
    setQuery(v);
    onQueryChange(v);
  };

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-10 py-8 sm:py-10">
      <PageHeader
        title="Book Search"
        subtitle="Search by title, author, subject, ISBN or rack — partial matches work too."
      />

      <div className="relative mb-8">
        <div className="flex items-center gap-3 bg-white rounded-2xl px-5 py-4 border border-navy-100 shadow-sm focus-within:border-cyan-400 focus-within:ring-2 focus-within:ring-cyan-100 transition-all">
          <Search className="w-5 h-5 text-navy-400 shrink-0" />
          <input
            autoFocus
            value={query}
            onChange={(e) => update(e.target.value)}
            placeholder="Type a few letters of the title…"
            className="flex-1 text-navy-900 placeholder-navy-400 bg-transparent outline-none text-base"
          />
          {query && (
            <button
              onClick={() => update('')}
              className="text-navy-400 hover:text-navy-700 text-sm font-medium"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <p className="text-navy-500 text-sm">
          {results.length} {results.length === 1 ? 'result' : 'results'}
          {query && (
            <>
              {' '}for “<span className="text-navy-800 font-medium">{query}</span>”
            </>
          )}
        </p>
      </div>

      {results.length === 0 ? (
        <div className="bg-white rounded-2xl border border-navy-100 p-12 text-center">
          <div className="w-16 h-16 rounded-full bg-navy-50 flex items-center justify-center mx-auto mb-4">
            <BookX className="w-8 h-8 text-navy-400" />
          </div>
          <h3 className="font-display font-bold text-xl text-navy-900">
            No books found
          </h3>
          <p className="text-navy-500 mt-1">
            Try a different spelling or fewer letters.
          </p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {results.map((book, i) => {
            const mapped = mappedRackIds.has(book.rackId);
            const secCode = sectionCode(sections, book.sectionId);
            const rName = rackName(racks, book.rackId);
            return (
              <button
                key={book.id}
                onClick={() => {
                  onSelectBook(book);
                  onNavigate('details');
                }}
                className="group text-left bg-white rounded-2xl p-6 border border-navy-100 shadow-sm hover:shadow-lg hover:border-cyan-300 transition-all animate-fade-in"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="w-11 h-11 rounded-lg bg-navy-900 flex items-center justify-center">
                    <BookMarked className="w-6 h-6 text-cyan-400" />
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      book.available
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-600'
                    }`}
                  >
                    {book.available ? 'Available' : 'Checked out'}
                  </span>
                </div>
                <h3 className="font-display font-bold text-lg text-navy-900 leading-snug group-hover:text-cyan-700 transition-colors">
                  {book.title}
                </h3>
                <p className="text-navy-500 text-sm mt-1">{book.author}</p>

                {/* Full location path */}
                <div className="mt-4">
                  <div
                    className={`flex items-center gap-1.5 font-semibold text-sm ${
                      mapped ? 'text-cyan-700' : 'text-amber-600'
                    }`}
                  >
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span className="flex items-center gap-0.5 text-xs">
                      <span className="px-1.5 py-0.5 rounded bg-navy-100 text-navy-700 font-medium">
                        {secCode}
                      </span>
                      <ChevronRight className="w-3 h-3 text-navy-300" />
                      <span className="px-1.5 py-0.5 rounded bg-navy-100 text-navy-700 font-mono font-medium">
                        {book.rackId}
                      </span>
                      <ChevronRight className="w-3 h-3 text-navy-300" />
                      <span className="px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-700 font-medium">
                        Shelf {book.shelfNumber}
                      </span>
                    </span>
                  </div>
                  <p className="text-navy-400 text-xs mt-1.5 truncate">{rName}</p>
                  {!mapped && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 font-medium mt-1 inline-block">
                      rack not on map
                    </span>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-end">
                  <ArrowRight className="w-5 h-5 text-navy-300 group-hover:text-cyan-600 group-hover:translate-x-1 transition-all" />
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
