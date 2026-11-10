import { useMemo, useState, useEffect } from 'react';
import {
  Radio,
  MapPin,
  Navigation,
  ArrowRight,
  Waves,
  AlertTriangle,
  DoorOpen,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import type { Book, LibraryMap, Rack, Section, ShelfCoord, ShelfModel } from '../types';

type Props = {
  books: Book[];
  map: LibraryMap;
  sections?: Section[];
  racks?: Rack[];
  shelves?: ShelfModel[];
  selectedShelf?: string | null;
  selectedRackId?: string | null;
  selectedBook?: Book | null;
  onSelectShelf?: (shelf: string) => void;
  onSelectRack?: (rackId: string) => void;
  onSelectBook?: (book: Book | null) => void;
};

// Manhattan-style route through a corridor then to the rack.
function buildRoute(start: { x: number; y: number }, end: { x: number; y: number }) {
  const midY = (end.y + start.y) / 2;
  return [
    `M ${start.x} ${start.y}`,
    `L ${start.x} ${midY}`,
    `L ${end.x} ${midY}`,
    `L ${end.x} ${end.y}`,
  ].join(' ');
}

// Map grid coords (0..11, 0..8) onto an SVG viewBox (0..120, 0..90) with padding.
const PAD_X = 6;
const PAD_Y = 6;
const STEP_X = 108 / 12;
const STEP_Y = 78 / 9;
function toViewBox(gx: number, gy: number) {
  return { x: PAD_X + gx * STEP_X, y: PAD_Y + gy * STEP_Y };
}

export default function NavigationPage({
  books,
  map,
  sections = [],
  racks = [],
  selectedShelf,
  selectedRackId,
  selectedBook,
  onSelectShelf,
  onSelectRack,
  onSelectBook,
}: Props) {
  const rackCoords: ShelfCoord[] = useMemo(
    () =>
      map.cells
        .filter((c) => c.type === 'rack' && Boolean(c.rackId))
        .map((c) => {
          const v = toViewBox(c.gridX, c.gridY);
          return { rackId: c.rackId as string, x: v.x, y: v.y };
        }),
    [map]
  );

  const entranceV = useMemo(
    () => toViewBox(map.entrance.gridX, map.entrance.gridY),
    [map]
  );

  // racks that have books (prioritized in list)
  const racksWithBooks = useMemo(
    () => new Set(books.map((b) => b.rackId)),
    [books]
  );

  const initialRackId = useMemo(() => {
    if (selectedRackId && rackCoords.some((r) => r.rackId === selectedRackId)) {
      return selectedRackId;
    }
    if (selectedShelf) {
      const parsed = selectedShelf.includes('-') && selectedShelf.split('-').length >= 3
        ? selectedShelf.split('-').slice(0, 2).join('-')
        : selectedShelf;
      if (rackCoords.some((r) => r.rackId === parsed)) {
        return parsed;
      }
    }
    if (selectedBook && rackCoords.some((r) => r.rackId === selectedBook.rackId)) {
      return selectedBook.rackId;
    }
    return rackCoords[0]?.rackId ?? '';
  }, [selectedRackId, selectedShelf, selectedBook, rackCoords]);

  const [activeRackId, setActiveRackId] = useState<string>(initialRackId);
  const [currentBook, setCurrentBook] = useState<Book | null>(selectedBook ?? null);

  useEffect(() => {
    if (initialRackId) {
      setActiveRackId(initialRackId);
    }
  }, [initialRackId]);

  useEffect(() => {
    if (selectedBook) {
      setCurrentBook(selectedBook);
      if (selectedBook.rackId) {
        setActiveRackId(selectedBook.rackId);
      }
    }
  }, [selectedBook]);

  // when the saved map changes, keep selection valid
  useEffect(() => {
    if (rackCoords.length === 0) return;
    const stillExists = rackCoords.some((s) => s.rackId === activeRackId);
    if (!stillExists) {
      const fallback = initialRackId || rackCoords[0].rackId;
      setActiveRackId(fallback);
    }
  }, [map, rackCoords, activeRackId, initialRackId]);

  const target = useMemo(
    () => rackCoords.find((s) => s.rackId === activeRackId) ?? null,
    [rackCoords, activeRackId]
  );

  const routePath = useMemo(
    () => (target ? buildRoute(entranceV, { x: target.x, y: target.y }) : ''),
    [entranceV, target]
  );

  const booksOnActiveRack = useMemo(
    () => books.filter((b) => b.rackId === activeRackId),
    [books, activeRackId]
  );

  const displayBook = useMemo(() => {
    if (currentBook && currentBook.rackId === activeRackId) {
      return currentBook;
    }
    return booksOnActiveRack[0] ?? null;
  }, [currentBook, activeRackId, booksOnActiveRack]);

  const chooseRack = (rackId: string, book?: Book) => {
    setActiveRackId(rackId);
    const chosenBook = book ?? books.find((b) => b.rackId === rackId) ?? null;
    setCurrentBook(chosenBook);
    onSelectRack?.(rackId);
    onSelectShelf?.(rackId);
    onSelectBook?.(chosenBook);
  };

  const dist = target
    ? Math.hypot(target.x - entranceV.x, target.y - entranceV.y)
    : 0;
  const strength = target ? Math.max(20, Math.round(100 - dist * 0.7)) : 0;

  const sortedRacks = useMemo(
    () =>
      [...rackCoords].sort((a, b) => {
        const ab = racksWithBooks.has(a.rackId) ? 0 : 1;
        const bb = racksWithBooks.has(b.rackId) ? 0 : 1;
        return ab - bb || a.rackId.localeCompare(b.rackId);
      }),
    [rackCoords, racksWithBooks]
  );

  const activeRack = racks.find((r) => r.id === activeRackId);
  const activeSection = sections.find((s) => s.id === activeRack?.sectionId);

  return (
    <div className="max-w-6xl mx-auto px-6 sm:px-10 py-8 sm:py-10">
      <PageHeader
        title="Library Navigation"
        subtitle="A top-down floor map with a simulated beacon guiding you from the entrance to your rack and shelf."
      />

      {rackCoords.length === 0 ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h3 className="font-display font-bold text-lg text-amber-800">
            No racks on the map yet
          </h3>
          <p className="text-amber-700 text-sm mt-1">
            A librarian needs to add racks in the Map Editor before navigation is available.
          </p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Floor map */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-navy-100 shadow-sm p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <h3 className="font-display font-bold text-lg text-navy-900">
                Floor Map
              </h3>
              <div className="flex items-center gap-2 text-xs text-navy-500 flex-wrap">
                <span className="inline-flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-navy-700" /> Rack
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-cyan-400" /> Destination
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-3 h-3 rounded-full bg-green-500" /> Entrance
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-3 h-3 rounded-sm bg-cyan-500/70" /> Pathway
                </span>
              </div>
            </div>

            <div className="w-full">
              <svg
                viewBox="0 0 120 90"
                className="w-full h-auto rounded-xl bg-gradient-to-br from-navy-50 to-white border border-navy-100"
              >
                {/* grid lines */}
                {Array.from({ length: 13 }).map((_, i) => (
                  <line
                    key={`v-${i}`}
                    x1={PAD_X + i * STEP_X}
                    y1={PAD_Y}
                    x2={PAD_X + i * STEP_X}
                    y2={PAD_Y + 9 * STEP_Y}
                    stroke="#e2e8f0"
                    strokeWidth="0.15"
                  />
                ))}
                {Array.from({ length: 10 }).map((_, i) => (
                  <line
                    key={`hz-${i}`}
                    x1={PAD_X}
                    y1={PAD_Y + i * STEP_Y}
                    x2={PAD_X + 12 * STEP_X}
                    y2={PAD_Y + i * STEP_Y}
                    stroke="#e2e8f0"
                    strokeWidth="0.15"
                  />
                ))}

                {/* pathways + blocked */}
                {map.cells
                  .filter((c) => c.type === 'pathway' || c.type === 'blocked')
                  .map((c) => {
                    const v = toViewBox(c.gridX, c.gridY);
                    if (c.type === 'blocked') {
                      return (
                        <rect
                          key={c.id}
                          x={v.x - 3}
                          y={v.y - 3}
                          width="6"
                          height="6"
                          rx="0.5"
                          fill="#ef4444"
                          opacity="0.5"
                        />
                      );
                    }
                    return (
                      <rect
                        key={c.id}
                        x={v.x - 3}
                        y={v.y - 3}
                        width="6"
                        height="6"
                        rx="0.5"
                        fill="#22d3ee"
                        opacity="0.25"
                      />
                    );
                  })}

                {/* racks */}
                {rackCoords.map((s) => {
                  const isTarget = s.rackId === activeRackId;
                  const hasBook = racksWithBooks.has(s.rackId);
                  return (
                    <g
                      key={s.rackId}
                      onClick={() => chooseRack(s.rackId)}
                      className="cursor-pointer"
                    >
                      <rect
                        x={s.x - 4}
                        y={s.y - 2.5}
                        width="8"
                        height="5"
                        rx="1"
                        fill={isTarget ? '#22d3ee' : hasBook ? '#1e3a66' : '#94a3b8'}
                        stroke={isTarget ? '#0e7490' : '#1e3a66'}
                        strokeWidth="0.25"
                        className="transition-all"
                      />
                      {/* spines */}
                      {[0, 1, 2, 3].map((i) => (
                        <line
                          key={i}
                          x1={s.x - 3 + i * 2}
                          y1={s.y - 2.2}
                          x2={s.x - 3 + i * 2}
                          y2={s.y + 2.2}
                          stroke={isTarget ? '#155e75' : '#3d6ba8'}
                          strokeWidth="0.25"
                        />
                      ))}
                      <text
                        x={s.x}
                        y={s.y + 5.2}
                        fontSize="2.4"
                        fontWeight="700"
                        fill={isTarget ? '#0e7490' : '#475569'}
                        textAnchor="middle"
                      >
                        {s.rackId}
                      </text>
                    </g>
                  );
                })}

                {/* route */}
                {target && (
                  <path
                    d={routePath}
                    fill="none"
                    stroke="#06b6d4"
                    strokeWidth="1.1"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeDasharray="5 3"
                    className="animate-route-dash"
                  />
                )}

                {/* entrance */}
                <g>
                  <circle
                    cx={entranceV.x}
                    cy={entranceV.y}
                    r="2.4"
                    fill="#22c55e"
                    stroke="#fff"
                    strokeWidth="0.4"
                  />
                  <DoorOpen className="hidden" />
                  <text
                    x={entranceV.x}
                    y={entranceV.y + 5}
                    fontSize="2.4"
                    fontWeight="700"
                    fill="#15803d"
                    textAnchor="middle"
                  >
                    ENTRANCE
                  </text>
                </g>

                {/* beacon pulse at destination */}
                {target && (
                  <g>
                    <circle
                      cx={target.x}
                      cy={target.y}
                      r="3"
                      fill="#22d3ee"
                      opacity="0.5"
                      className="animate-beacon-pulse"
                      style={{
                        transformOrigin: `${target.x}px ${target.y}px`,
                      }}
                    />
                    <circle
                      cx={target.x}
                      cy={target.y}
                      r="1.5"
                      fill="#06b6d4"
                      stroke="#fff"
                      strokeWidth="0.35"
                    />
                  </g>
                )}

                {/* border */}
                <rect
                  x={PAD_X - 2}
                  y={PAD_Y - 2}
                  width={12 * STEP_X + 4}
                  height={9 * STEP_Y + 4}
                  rx="1.5"
                  fill="none"
                  stroke="#1e3a66"
                  strokeWidth="0.5"
                  opacity="0.3"
                />
              </svg>
            </div>
          </div>

          {/* Control panel */}
          <div className="space-y-5">
            {/* Beacon signal */}
            <div className="bg-gradient-to-br from-navy-900 to-navy-950 text-white rounded-2xl p-6 shadow-lg">
              <div className="flex items-center gap-2 text-cyan-400 mb-3">
                <Radio className="w-5 h-5 animate-spin-slow" />
                <span className="font-semibold text-sm uppercase tracking-wide">
                  Beacon Signal
                </span>
              </div>
              <div className="font-display font-extrabold text-3xl">
                Rack {target?.rackId ?? '—'}
              </div>
              {activeRack && (
                <p className="text-navy-300 text-sm mt-0.5">
                  {activeRack.rackName} {activeSection ? `(${activeSection.name})` : ''}
                </p>
              )}

              {displayBook ? (
                <div className="mt-3">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-cyan-400/20 text-cyan-300 font-semibold text-xs border border-cyan-400/30">
                    <MapPin className="w-3.5 h-3.5" />
                    Target Shelf: {displayBook.shelfNumber}
                  </div>
                  <p className="text-navy-200 text-sm mt-2 truncate font-medium">
                    Routing to “{displayBook.title}”
                  </p>
                </div>
              ) : (
                <p className="text-navy-400 text-sm mt-2">
                  No book catalogued on this rack.
                </p>
              )}

              <div className="mt-5">
                <div className="flex items-center justify-between text-xs text-navy-300 mb-1.5">
                  <span className="flex items-center gap-1">
                    <Waves className="w-3.5 h-3.5" />
                    Signal strength
                  </span>
                  <span className="font-mono text-cyan-300">{strength}%</span>
                </div>
                <div className="h-2 rounded-full bg-navy-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-400 to-cyan-300 rounded-full transition-all duration-500"
                    style={{ width: `${strength}%` }}
                  />
                </div>
              </div>

              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-navy-300">Distance from entrance</span>
                <span className="font-mono text-white">
                  {target ? Math.round(dist * 1.2) : 0} m
                </span>
              </div>
            </div>

            {/* Change destination */}
            <div className="bg-white rounded-2xl border border-navy-100 p-6">
              <h4 className="font-display font-bold text-navy-900 mb-1">
                Change destination
              </h4>
              <p className="text-navy-500 text-sm mb-4">
                Pick any rack on the map.
              </p>
              <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                {sortedRacks.map((s) => {
                  const rackBooks = books.filter((b) => b.rackId === s.rackId);
                  const isActive = s.rackId === activeRackId;
                  const rackInfo = racks.find((r) => r.id === s.rackId);
                  const secInfo = sections.find((sec) => sec.id === rackInfo?.sectionId);

                  return (
                    <div
                      key={s.rackId}
                      className={`rounded-xl border transition-all ${
                        isActive
                          ? 'border-cyan-400 bg-cyan-50'
                          : 'border-navy-100 bg-white hover:border-navy-300'
                      }`}
                    >
                      <button
                        onClick={() => chooseRack(s.rackId)}
                        className="w-full text-left flex items-center justify-between gap-3 px-4 py-3"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-cyan-600 shrink-0" />
                            <span className="font-semibold text-navy-900 text-sm">
                              Rack {s.rackId}
                            </span>
                            {rackInfo?.rackName && (
                              <span className="text-xs text-navy-500 truncate">
                                · {rackInfo.rackName}
                              </span>
                            )}
                            {secInfo && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-navy-100 text-navy-700 font-medium">
                                {secInfo.code}
                              </span>
                            )}
                            {rackBooks.length === 0 && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-navy-100 text-navy-500 font-medium">
                                empty
                              </span>
                            )}
                          </div>
                        </div>
                        {isActive ? (
                          <Navigation className="w-5 h-5 text-cyan-600 shrink-0" />
                        ) : (
                          <ArrowRight className="w-4 h-4 text-navy-300 shrink-0" />
                        )}
                      </button>

                      {/* If rack has books, show them with their shelf numbers */}
                      {rackBooks.length > 0 && (
                        <div className="px-4 pb-3 pt-0 border-t border-navy-100/50 mt-1 space-y-1">
                          {rackBooks.map((b) => {
                            const isBookSelected = currentBook?.id === b.id;
                            return (
                              <button
                                key={b.id}
                                onClick={() => chooseRack(s.rackId, b)}
                                className={`w-full text-left text-xs px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors ${
                                  isBookSelected
                                    ? 'bg-cyan-200/60 text-cyan-900 font-semibold'
                                    : 'text-navy-600 hover:bg-navy-50'
                                }`}
                              >
                                <span className="truncate mr-2">{b.title}</span>
                                <span className="shrink-0 font-mono px-1.5 py-0.5 rounded bg-navy-100/80 text-navy-700 text-[10px]">
                                  Shelf {b.shelfNumber}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
