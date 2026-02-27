import { useState, useEffect, useRef } from 'react';
import { BookOpen, X, Calendar, ChevronRight, Loader2, Sparkles, Map } from 'lucide-react';
import axios from '../../utils/axios';

// ─── Reuse your existing formatInline & RoadmapRenderer ──────────────────────

const phaseColors = [
  "from-indigo-500 to-indigo-600",
  "from-purple-500 to-purple-600",
  "from-blue-500 to-blue-600",
  "from-violet-500 to-violet-600",
  "from-fuchsia-500 to-fuchsia-600",
  "from-sky-500 to-sky-600",
];

const formatInline = (text) =>
  text
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
    .replace(/`(.+?)`/g, '<code class="bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded text-xs font-mono border border-indigo-100">$1</code>');

const RoadmapRenderer = ({ text }) => {
  if (!text) return null;
  const lines = text.split('\n');
  const elements = [];
  let key = 0;
  let phaseIndex = 0;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) { i++; continue; }

    if (/^Phase \d+/i.test(line)) {
      const gradient = phaseColors[phaseIndex % phaseColors.length];
      const num = phaseIndex + 1;
      phaseIndex++;
      i++;
      const desc = lines[i] && !/^[\*\-•]/.test(lines[i].trim()) ? lines[i].trim() : '';
      if (desc) i++;
      elements.push(
        <div key={key++} className="mt-8 mb-1">
          <div className={`bg-gradient-to-r ${gradient} rounded-2xl p-5 shadow-sm`}>
            <div className="flex items-center gap-3 mb-1">
              <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">{num}</span>
              <h3 className="text-white font-bold text-base leading-tight">{line}</h3>
            </div>
            {desc && <p className="text-white/80 text-sm ml-11">{desc}</p>}
          </div>
        </div>
      );
      continue;
    }

    if (/^[\*\-•]\s+/.test(line)) {
      const bullets = [];
      while (i < lines.length && /^[\*\-•]\s+/.test(lines[i].trim())) {
        bullets.push(lines[i].trim().replace(/^[\*\-•]\s+/, ''));
        i++;
      }
      elements.push(
        <ul key={key++} className="space-y-2.5 my-3 ml-2">
          {bullets.map((b, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm text-gray-700 bg-gray-50 rounded-xl px-4 py-2.5">
              <span className="mt-0.5 text-indigo-400 font-bold flex-shrink-0">›</span>
              <span dangerouslySetInnerHTML={{ __html: formatInline(b) }} />
            </li>
          ))}
        </ul>
      );
      continue;
    }

    if (/^Would you|^Do you/.test(line)) {
      elements.push(
        <div key={key++} className="mt-8 bg-indigo-50 border border-indigo-200 rounded-2xl px-5 py-4">
          <p className="text-indigo-700 text-sm font-medium italic">{line}</p>
        </div>
      );
      i++; continue;
    }

    i++;
  }

  return <div>{elements}</div>;
};

// ─── Roadmap Modal ────────────────────────────────────────────────────────────

const RoadmapModal = ({ item, onClose }) => {
  const overlayRef = useRef();

  // Close on backdrop click
  const handleOverlayClick = (e) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const date = item.createdAt
    ? new Date(item.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
    : null;

  return (
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
      style={{ animation: 'fadeIn 0.15s ease' }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden"
        style={{ animation: 'slideUp 0.2s ease' }}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 flex items-start justify-between flex-shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <Sparkles className="w-5 h-5 text-white flex-shrink-0" />
            <div className="min-w-0">
              <h2 className="text-white font-bold text-lg leading-tight truncate">{item.Subject}</h2>
              {date && <p className="text-indigo-200 text-xs mt-0.5">Saved on {date}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="ml-4 flex-shrink-0 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* Modal Body — scrollable */}
        <div className="overflow-y-auto flex-1 px-6 py-4 pb-8">
          <RoadmapRenderer text={item.roadmap} />
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(20px) } to { opacity: 1; transform: translateY(0) } }
      `}</style>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

const RoadmapListPage = () => {
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selected, setSelected] = useState(null); // currently open roadmap

  useEffect(() => {
    const fetchRoadmaps = async () => {
      try {
        const res = await axios.get('/ai/all_road_map');
        const data = res.data?.data ?? res.data;
        setRoadmaps(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err?.response?.data?.message || 'Failed to load roadmaps.');
      } finally {
        setLoading(false);
      }
    };
    fetchRoadmaps();
  }, []);

  // ── Loading ──
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-indigo-500 animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">Loading your roadmaps...</p>
        </div>
      </div>
    );
  }

  // ── Error ──
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center max-w-sm">
          <p className="text-red-600 font-medium">⚠️ {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Map className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">My Roadmaps</h1>
          </div>
          <p className="text-gray-500">Click on any subject to view its full roadmap</p>
        </div>

        {/* Empty State */}
        {roadmaps.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Roadmaps Yet</h3>
            <p className="text-gray-500 text-sm">Generate and save a roadmap to see it here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {roadmaps.map((item, index) => {
              const date = item.createdAt
                ? new Date(item.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
                : null;

              return (
               <button
  key={item._id ?? index}
  onClick={() => setSelected(item)}
  className="w-full bg-white rounded-2xl border border-gray-200 px-5 py-4 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all text-left flex items-center gap-4 group"
>
  {/* Index badge */}
  <span className="w-10 h-10 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
    {index + 1}
  </span>

  {/* Text */}
  <div className="flex-1 min-w-0">
    <p className="font-semibold text-gray-800 truncate group-hover:text-indigo-700 transition-colors">
      {item.subject}  {/* ✅ capital S — matches your backend model */}
    </p>
    {date && (
      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
        <Calendar className="w-3 h-3" />
        {date}
      </p>
    )}
  </div>

  <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-500 transition-colors flex-shrink-0" />
</button>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal */}
      {selected && (
        <RoadmapModal item={selected} onClose={() => setSelected(null)} />
      )}
    </div>
  );
};

export default RoadmapListPage;