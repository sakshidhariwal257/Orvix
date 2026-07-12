import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader2 } from 'lucide-react';
import { globalSearch } from '../../api/search';

export default function SearchDropdown() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const boxRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    function onClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setResults(null);
      return;
    }
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await globalSearch(query.trim());
        setResults(data);
      } catch {
        setResults(null);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(timeout);
  }, [query]);

  const hasAny =
    results && (results.teams?.length || results.boards?.length || results.tasks?.length || results.members?.length);

  const goTo = (path) => {
    setOpen(false);
    setQuery('');
    setResults(null);
    navigate(path);
  };

  return (
    <div className="relative w-full max-w-md" ref={boxRef}>
      <div className="flex items-center gap-2 bg-white/[0.03] border border-border rounded-[10px] px-3 py-2">
        <Search size={16} className="text-text-faint" />
        <input
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          placeholder="Search anything…"
          className="bg-transparent outline-none border-none text-[13.5px] text-text placeholder:text-text-faint w-full"
        />
        {loading && <Loader2 size={14} className="animate-spin text-text-faint" />}
      </div>

      {open && query.trim() && (
        <div className="absolute mt-2 w-full bg-[#0d1120] border border-border-strong rounded-lg shadow-xl z-50 max-h-96 overflow-y-auto p-2">
          {!results && !loading && (
            <div className="text-center text-text-dim text-xs py-6">Type to search…</div>
          )}
          {results && !hasAny && (
            <div className="text-center text-text-dim text-xs py-6">No results for "{query}"</div>
          )}

          {results?.teams?.length > 0 && (
            <SearchSection title="Teams">
              {results.teams.map((t) => (
                <SearchRow key={t._id} label={t.name} onClick={() => goTo('/dashboard/teams')} />
              ))}
            </SearchSection>
          )}

          {results?.boards?.length > 0 && (
            <SearchSection title="Boards">
              {results.boards.map((b) => (
                <SearchRow key={b._id} label={b.name} onClick={() => goTo(`/dashboard/boards/${b._id}`)} />
              ))}
            </SearchSection>
          )}

          {results?.tasks?.length > 0 && (
            <SearchSection title="Tasks">
              {results.tasks.map((t) => (
                <SearchRow key={t._id} label={t.title} sub={t.status} onClick={() => goTo(`/dashboard/boards/${t.board}`)} />
              ))}
            </SearchSection>
          )}

          {results?.members?.length > 0 && (
            <SearchSection title="Members">
              {results.members.map((m) => (
                <SearchRow key={m._id} label={m.name} sub={m.email} onClick={() => goTo('/dashboard/teams')} />
              ))}
            </SearchSection>
          )}
        </div>
      )}
    </div>
  );
}

function SearchSection({ title, children }) {
  return (
    <div className="mb-2 last:mb-0">
      <div className="px-2 py-1 text-[10.5px] uppercase tracking-wider text-text-faint font-semibold">{title}</div>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

function SearchRow({ label, sub, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-left px-2 py-2 rounded-lg hover:bg-white/[0.05] flex items-center justify-between gap-2"
    >
      <span className="text-[13px] text-text truncate">{label}</span>
      {sub && <span className="text-[11px] text-text-faint flex-shrink-0">{sub}</span>}
    </button>
  );
}
