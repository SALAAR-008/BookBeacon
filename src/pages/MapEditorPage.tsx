import { useMemo, useRef, useState } from 'react';
import {
  Save,
  RotateCcw,
  Plus,
  Trash2,
  Pencil,
  DoorOpen,
  Route,
  Ban,
  BookMarked,
  MapPin,
  X,
  Info,
  GripVertical,
} from 'lucide-react';
import PageHeader from '../components/PageHeader';
import type { CellType, LibraryMap, MapCell, Rack, Section } from '../types';
import { GRID_COLS, GRID_ROWS, SEED_MAP } from '../data';

type Props = {
  map: LibraryMap;
  sections?: Section[];
  racks?: Rack[];
  onSave: (map: LibraryMap) => void;
  onReset: () => void;
};

type Tool = 'rack' | 'entrance' | 'pathway' | 'blocked' | 'erase';

const TOOL_META: Record<Tool, { label: string; icon: typeof Save; color: string }> = {
  rack: { label: 'Rack', icon: BookMarked, color: 'bg-navy-700' },
  entrance: { label: 'Entrance', icon: DoorOpen, color: 'bg-green-600' },
  pathway: { label: 'Pathway', icon: Route, color: 'bg-cyan-500' },
  blocked: { label: 'Blocked', icon: Ban, color: 'bg-red-500' },
  erase: { label: 'Erase', icon: X, color: 'bg-navy-300' },
};

const COL_LETTERS = 'ABCDEFGHIJKL';

function cellKey(x: number, y: number) {
  return `${x},${y}`;
}

export default function MapEditorPage({ map, sections = [], racks = [], onSave, onReset }: Props) {
  // working copy — only committed to parent on Save
  const [draft, setDraft] = useState<LibraryMap>(() => ({
    entrance: { ...map.entrance },
    cells: map.cells.map((c) => ({ ...c })),
  }));
  const [tool, setTool] = useState<Tool>('rack');
  const [dragging, setDragging] = useState<string | null>(null);
  const [editingCell, setEditingCell] = useState<MapCell | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [dirty, setDirty] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  const cellMap = useMemo(() => {
    const m = new Map<string, MapCell>();
    draft.cells.forEach((c) => m.set(cellKey(c.gridX, c.gridY), c));
    return m;
  }, [draft]);

  const rackCells = useMemo(
    () => draft.cells.filter((c) => c.type === 'rack'),
    [draft]
  );

  const isEntrance = (x: number, y: number) =>
    draft.entrance.gridX === x && draft.entrance.gridY === y;

  const markDirty = (next: LibraryMap) => {
    setDraft(next);
    setDirty(true);
  };

  const placeCell = (x: number, y: number) => {
    if (isEntrance(x, y)) return; // never overwrite entrance
    const existing = cellMap.get(cellKey(x, y));
    if (tool === 'erase') {
      if (existing) markDirty({ ...draft, cells: draft.cells.filter((c) => c.id !== existing.id) });
      return;
    }
    if (tool === 'entrance') {
      // move entrance, remove any cell at the target
      markDirty({
        ...draft,
        entrance: { gridX: x, gridY: y },
        cells: draft.cells.filter((c) => c.gridX !== x || c.gridY !== y),
      });
      return;
    }
    if (existing && existing.type === tool) return; // same type, no-op
    if (existing) {
      // replace
      markDirty({
        ...draft,
        cells: draft.cells.map((c) =>
          c.id === existing.id
            ? {
                ...c,
                type: tool as CellType,
                rackId: tool === 'rack' ? (c.rackId || nextRackId(draft.cells, racks)) : undefined,
              }
            : c
        ),
      });
      return;
    }
    // new cell
    const id = `cell-${Date.now()}-${Math.round(Math.random() * 1000)}`;
    const newCell: MapCell = {
      id,
      type: tool as CellType,
      gridX: x,
      gridY: y,
      ...(tool === 'rack'
        ? { rackId: nextRackId(draft.cells, racks) }
        : {}),
    };
    markDirty({ ...draft, cells: [...draft.cells, newCell] });
  };

  const startDrag = (id: string) => {
    if (tool !== 'rack') return;
    setDragging(id);
  };

  const dropDrag = (x: number, y: number) => {
    if (!dragging) return;
    if (isEntrance(x, y)) {
      setDragging(null);
      return;
    }
    const occupied = cellMap.get(cellKey(x, y));
    if (occupied && occupied.id !== dragging) {
      setDragging(null);
      return;
    }
    markDirty({
      ...draft,
      cells: draft.cells.map((c) =>
        c.id === dragging ? { ...c, gridX: x, gridY: y } : c
      ),
    });
    setDragging(null);
  };

  const updateRackCell = (id: string, patch: Partial<MapCell>) => {
    markDirty({
      ...draft,
      cells: draft.cells.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  };

  const deleteRackCell = (id: string) => {
    markDirty({ ...draft, cells: draft.cells.filter((c) => c.id !== id) });
    setEditingCell(null);
  };

  const handleSave = () => {
    onSave(draft);
    setDirty(false);
  };

  const handleReset = () => {
    setDraft({
      entrance: { ...SEED_MAP.entrance },
      cells: SEED_MAP.cells.map((c) => ({ ...c })),
    });
    setDirty(false);
    onReset();
    setConfirmReset(false);
  };

  const handleGridClick = (x: number, y: number) => {
    if (dragging) {
      dropDrag(x, y);
      return;
    }
    const cell = cellMap.get(cellKey(x, y));
    if (cell?.type === 'rack' && tool === 'rack') {
      setEditingCell(cell);
      return;
    }
    placeCell(x, y);
  };

  const usedRackIds = new Set(rackCells.map((c) => c.rackId));

  return (
    <div className="max-w-7xl mx-auto px-6 sm:px-10 py-8 sm:py-10">
      <PageHeader
        title="Visual Library Map Editor"
        subtitle="Add, drag, edit and remove racks. Changes apply to student navigation once saved."
        actions={
          <>
            <button
              onClick={() => setConfirmReset(true)}
              className="px-4 py-2.5 rounded-lg border border-navy-200 text-navy-600 font-medium text-sm hover:bg-navy-50 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Map
            </button>
            <button
              onClick={handleSave}
              disabled={!dirty}
              className="px-4 py-2.5 rounded-lg bg-cyan-500 text-white font-semibold text-sm hover:bg-cyan-600 transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              Save Map
            </button>
          </>
        }
      />

      {dirty && (
        <div className="mb-6 rounded-xl bg-cyan-50 border border-cyan-200 px-4 py-3 flex items-center gap-2 text-cyan-800 text-sm">
          <Info className="w-4 h-4 shrink-0" />
          You have unsaved changes. Click <strong>Save Map</strong> to update student navigation.
        </div>
      )}

      <div className="grid lg:grid-cols-4 gap-6">
        {/* Tools + grid */}
        <div className="lg:col-span-3 space-y-4">
          {/* Toolbar */}
          <div className="bg-white rounded-2xl border border-navy-100 shadow-sm p-4">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wide text-navy-500 mr-1">
                Tools
              </span>
              {(Object.keys(TOOL_META) as Tool[]).map((t) => {
                const meta = TOOL_META[t];
                const Icon = meta.icon;
                return (
                  <button
                    key={t}
                    onClick={() => setTool(t)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-all ${
                      tool === t
                        ? `${meta.color} text-white shadow-sm`
                        : 'bg-navy-50 text-navy-600 hover:bg-navy-100'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {meta.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-navy-400 mt-3">
              Tip: with the <strong>Rack</strong> tool selected, click a rack to
              edit its ID, or drag a rack to a new grid cell.
            </p>
          </div>

          {/* Grid */}
          <div className="bg-white rounded-2xl border border-navy-100 shadow-sm p-4 sm:p-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-display font-bold text-navy-900 text-sm">
                Floor Plan Grid ({GRID_COLS} × {GRID_ROWS})
              </h3>
              <div className="flex items-center gap-2 text-xs text-navy-500">
                <span className="inline-flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-navy-700" /> Rack
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-green-600" /> Entrance
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-cyan-500" /> Pathway
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-3 h-3 rounded bg-red-500" /> Blocked
                </span>
              </div>
            </div>

            <div
              ref={gridRef}
              className="grid gap-1 select-none"
              style={{
                gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
              }}
            >
              {/* column headers */}
              {Array.from({ length: GRID_COLS }).map((_, x) => (
                <div
                  key={`h-${x}`}
                  className="text-center text-[10px] font-semibold text-navy-400 pb-1"
                >
                  {COL_LETTERS[x]}
                </div>
              ))}

              {Array.from({ length: GRID_ROWS }).map((_, y) =>
                Array.from({ length: GRID_COLS }).map((_, x) => {
                  const cell = cellMap.get(cellKey(x, y));
                  const entrance = isEntrance(x, y);
                  const isDragTarget = dragging && cell?.id === dragging;
                  return (
                    <div
                      key={cellKey(x, y)}
                      onClick={() => handleGridClick(x, y)}
                      onMouseUp={() => dragging && dropDrag(x, y)}
                      className={`aspect-square rounded-md flex items-center justify-center cursor-pointer transition-all relative text-[9px] font-semibold ${
                        entrance
                          ? 'bg-green-600 text-white'
                          : cell?.type === 'rack'
                          ? 'bg-navy-700 text-white hover:ring-2 hover:ring-cyan-400'
                          : cell?.type === 'pathway'
                          ? 'bg-cyan-500/70 text-white'
                          : cell?.type === 'blocked'
                          ? 'bg-red-500/70 text-white'
                          : 'bg-navy-50 hover:bg-navy-100'
                      } ${isDragTarget ? 'opacity-40 ring-2 ring-cyan-400' : ''}`}
                      draggable={cell?.type === 'rack'}
                      onDragStart={() => cell?.type === 'rack' && startDrag(cell.id)}
                      onDragEnd={() => setDragging(null)}
                      onDragOver={(e) => e.preventDefault()}
                      onDrop={(e) => {
                        e.preventDefault();
                        dropDrag(x, y);
                      }}
                      title={
                        entrance
                          ? 'Entrance'
                          : cell
                          ? `${cell.rackId ?? cell.type}`
                          : 'Empty'
                      }
                    >
                      {entrance ? (
                        <DoorOpen className="w-3.5 h-3.5" />
                      ) : cell?.type === 'rack' ? (
                        <span className="flex flex-col items-center leading-none">
                          <GripVertical className="w-2.5 h-2.5 opacity-50" />
                          <span className="mt-0.5">{cell.rackId}</span>
                        </span>
                      ) : cell?.type === 'pathway' ? (
                        <Route className="w-3 h-3" />
                      ) : cell?.type === 'blocked' ? (
                        <Ban className="w-3 h-3" />
                      ) : null}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* Rack list / inspector */}
        <div className="space-y-4">
          {/* Edit selected rack */}
          {editingCell && editingCell.type === 'rack' && (
            <div className="bg-white rounded-2xl border border-cyan-300 shadow-sm p-5">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-display font-bold text-navy-900 flex items-center gap-2">
                  <Pencil className="w-4 h-4 text-cyan-600" />
                  Edit Rack
                </h4>
                <button
                  onClick={() => setEditingCell(null)}
                  className="p-1.5 rounded-lg hover:bg-navy-50 text-navy-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-navy-500 mb-1">
                    Rack ID
                  </label>
                  <input
                    value={editingCell.rackId ?? ''}
                    onChange={(e) => {
                      const val = e.target.value.toUpperCase();
                      setEditingCell({ ...editingCell, rackId: val });
                      updateRackCell(editingCell.id, { rackId: val });
                    }}
                    className={inputCls}
                    placeholder="e.g. A-01 or E-01"
                  />
                  {editingCell.rackId &&
                    usedRackIds.has(editingCell.rackId) &&
                    rackCells.filter((c) => c.rackId === editingCell.rackId).length > 1 && (
                      <p className="text-xs text-amber-600 mt-1">
                        Duplicate rack ID — each rack on map must have a unique ID.
                      </p>
                    )}
                </div>

                {/* Show details if matched with a known library rack */}
                {(() => {
                  const matched = racks.find((r) => r.id === editingCell.rackId);
                  const matchedSec = sections.find((s) => s.id === matched?.sectionId);
                  if (matched) {
                    return (
                      <div className="rounded-lg bg-navy-50 p-3 text-xs text-navy-700 space-y-1">
                        <div>
                          <strong>Rack Name:</strong> {matched.rackName}
                        </div>
                        <div>
                          <strong>Section:</strong> {matchedSec?.name ?? matched.sectionId}
                        </div>
                        <div>
                          <strong>Shelves:</strong> {matched.numberOfShelves} tiers
                        </div>
                      </div>
                    );
                  }
                  return (
                    <p className="text-xs text-navy-400">
                      Saving this map will register this new rack in the library with 5 default shelves.
                    </p>
                  );
                })()}

                <div className="flex items-center justify-between text-xs text-navy-400 pt-1">
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    Position: {COL_LETTERS[editingCell.gridX]}-{editingCell.gridY + 1}
                  </span>
                  <span className="flex items-center gap-1">
                    <GripVertical className="w-3 h-3" />
                    Drag to move
                  </span>
                </div>
                <button
                  onClick={() => deleteRackCell(editingCell.id)}
                  className="w-full px-3 py-2 rounded-lg bg-red-50 text-red-600 font-medium text-sm hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Remove rack from map
                </button>
              </div>
            </div>
          )}

          {/* Rack list */}
          <div className="bg-white rounded-2xl border border-navy-100 shadow-sm p-5">
            <h4 className="font-display font-bold text-navy-900 flex items-center gap-2 mb-3">
              <BookMarked className="w-4 h-4 text-cyan-600" />
              Racks on Map ({rackCells.length})
            </h4>
            <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
              {rackCells.length === 0 && (
                <p className="text-sm text-navy-400 py-4 text-center">
                  No racks yet. Use the Rack tool on the grid to add one.
                </p>
              )}
              {rackCells.map((c) => {
                const matched = racks.find((r) => r.id === c.rackId);
                return (
                  <button
                    key={c.id}
                    onClick={() => setEditingCell(c)}
                    className={`w-full text-left flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg border transition-all ${
                      editingCell?.id === c.id
                        ? 'border-cyan-400 bg-cyan-50'
                        : 'border-navy-100 hover:border-navy-300 hover:bg-navy-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="font-mono font-semibold text-sm text-navy-900">
                        {c.rackId}
                      </div>
                      <div className="text-xs text-navy-400 truncate">
                        {matched?.rackName ?? 'Rack'} · {COL_LETTERS[c.gridX]}-{c.gridY + 1}
                      </div>
                    </div>
                    <Pencil className="w-4 h-4 text-navy-300 shrink-0" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Quick add rack button */}
          <button
            onClick={() => {
              setTool('rack');
              setEditingCell(null);
            }}
            className="w-full px-4 py-2.5 rounded-lg bg-navy-900 text-white font-semibold text-sm hover:bg-navy-800 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add rack on grid
          </button>
        </div>
      </div>

      {confirmReset && (
        <ConfirmDialog
          title="Reset map to default?"
          message="This restores the original sample floor plan and discards your unsaved edits."
          confirmLabel="Reset"
          onConfirm={handleReset}
          onClose={() => setConfirmReset(false)}
        />
      )}
    </div>
  );
}

function nextRackId(cells: MapCell[], existingRacks: Rack[] = []): string {
  const used = new Set(cells.filter((c) => c.type === 'rack' && Boolean(c.rackId)).map((c) => c.rackId!));
  // Prefer unmapped rack from existing racks if available
  const unmapped = existingRacks.find((r) => !used.has(r.id));
  if (unmapped) return unmapped.id;

  // Otherwise pick next free letter-number combo (e.g. A-01, A-02...)
  for (let i = 0; i < 26; i++) {
    const letter = String.fromCharCode(65 + i);
    for (let n = 1; n <= 20; n++) {
      const candidate = `${letter}-${String(n).padStart(2, '0')}`;
      if (!used.has(candidate)) return candidate;
    }
  }
  return `R-${Date.now()}`;
}

const inputCls =
  'w-full px-3 py-2 rounded-lg border border-navy-200 text-navy-900 placeholder-navy-400 bg-white outline-none focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100 transition-all text-sm';

function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onConfirm,
  onClose,
}: {
  title: string;
  message: string;
  confirmLabel: string;
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
            className="px-4 py-2 rounded-lg bg-cyan-500 text-white font-semibold hover:bg-cyan-600 transition-colors"
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
