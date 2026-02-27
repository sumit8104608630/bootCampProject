import { useState } from 'react';
import { Sparkles, Target, ChevronRight, Loader2, RefreshCw } from 'lucide-react';
import axios from '../../utils/axios';
import { Check } from 'lucide-react';
// ─── Roadmap Renderer ─────────────────────────────────────────────────────────

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
  const lines = text.split("\n");
  const elements = [];
  let key = 0;
  let phaseIndex = 0;
  let i = 0;

  while (i < lines.length) {
    const line = lines[i].trim();
    if (!line) { i++; continue; }

    // Phase heading
    if (/^Phase \d+/i.test(line)) {
      const gradient = phaseColors[phaseIndex % phaseColors.length];
      const num = phaseIndex + 1;
      phaseIndex++;
      i++;
      const desc = lines[i] && !/^[\*\-•]/.test(lines[i].trim()) ? lines[i].trim() : "";
      if (desc) i++;

      elements.push(
        <div key={key++} className="mt-8 mb-1">
          <div className={`bg-gradient-to-r ${gradient} rounded-2xl p-5 shadow-sm`}>
            <div className="flex items-center gap-3 mb-1">
              <span className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                {num}
              </span>
              <h3 className="text-white font-bold text-base leading-tight">{line}</h3>
            </div>
            {desc && <p className="text-white/80 text-sm ml-11">{desc}</p>}
          </div>
        </div>
      );
      continue;
    }

    // Bullet list
    if (/^[\*\-•]\s+/.test(line)) {
      const bullets = [];
      while (i < lines.length && /^[\*\-•]\s+/.test(lines[i].trim())) {
        bullets.push(lines[i].trim().replace(/^[\*\-•]\s+/, ""));
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

    // Closing question
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

// ─── Main Component ───────────────────────────────────────────────────────────

const qualificationLabels = {
  grade_10: 'Grade 10 (Matriculation)',
  grade_11: 'Grade 11',
  grade_12: 'Grade 12 (Intermediate)',
  undergraduate: "Undergraduate (Bachelor's)",
  postgraduate: "Postgraduate (Master's)",
  phd: 'PhD / Doctorate',
  diploma: 'Diploma / Certificate',
  professional: 'Professional Certification',
};

const ratingLabels = [
  'Almost nothing', 'Very little', 'Basic ideas', 'Some concepts',
  'Getting there', 'Decent grasp', 'Pretty solid', 'Strong knowledge',
  'Very strong', 'Expert level',
];

const levelEmoji = { beginner: '🌱', intermediate: '🔥', advanced: '⚡' };

const AIRoadmapGenerator = () => {
    const [saving, setSaving] = useState(false);
const [saveSuccess, setSaveSuccess] = useState(false);
  const [formData, setFormData] = useState({
    goal: '',
    level: 'beginner',
    qualification: '',
    qualificationOther: '',
    knowledgeRating: 5,
    extraDescription: '',
  });

  // Snapshot of submitted data to show in profile card
  const [submittedProfile, setSubmittedProfile] = useState(null);
  const [generating, setGenerating] = useState(false);
  const [roadmapText, setRoadmapText] = useState('');
  const [error, setError] = useState('');

  const qualificationOptions = [
    { value: 'grade_10', label: 'Grade 10 (Matriculation)' },
    { value: 'grade_11', label: 'Grade 11' },
    { value: 'grade_12', label: 'Grade 12 (Intermediate)' },
    { value: 'undergraduate', label: "Undergraduate (Bachelor's)" },
    { value: 'postgraduate', label: "Postgraduate (Master's)" },
    { value: 'phd', label: 'PhD / Doctorate' },
    { value: 'diploma', label: 'Diploma / Certificate' },
    { value: 'professional', label: 'Professional Certification' },
    { value: 'other', label: 'Other (specify below)' },
  ];

  const levels = [
    { value: 'beginner', label: 'Beginner', emoji: '🌱' },
    { value: 'intermediate', label: 'Intermediate', emoji: '🔥' },
    { value: 'advanced', label: 'Advanced', emoji: '⚡' },
  ];

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setRoadmapText('');

    const qualification =
      formData.qualification === 'other'
        ? formData.qualificationOther
        : formData.qualification;

    const payload = {
      goal: formData.goal,
      level: formData.level,
      qualification,
      knowledgeRating: formData.knowledgeRating,
      extraDescription: formData.extraDescription,
    };

    // Save profile snapshot for the profile card
    setSubmittedProfile({
      goal: formData.goal,
      level: formData.level,
      qualification:
        formData.qualification === 'other'
          ? formData.qualificationOther
          : qualificationLabels[formData.qualification] || formData.qualification,
      knowledgeRating: formData.knowledgeRating,
    });

    setGenerating(true);
    try {
      const res = await axios.post('/ai/road_map_generate', payload);
      const text = res.data?.data ?? res.data;
      setRoadmapText(typeof text === 'string' ? text : JSON.stringify(text));
    } catch (err) {
      console.error(err);
      setError(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const handleRegenerate = () => {
    setRoadmapText('');
    setError('');
    setSubmittedProfile(null);
  };

  const isValid =
    formData.goal.trim() &&
    formData.qualification &&
    (formData.qualification !== 'other' || formData.qualificationOther.trim());

  return (
    <div className="min-h-screen p-6 bg-gray-50">
      <div className="max-w-3xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Sparkles className="w-8 h-8 text-indigo-600" />
            <h1 className="text-3xl font-bold text-gray-900">AI Study Roadmap</h1>
          </div>
          <p className="text-gray-600">Let AI create a personalized learning path tailored to your goals</p>
        </div>

        {/* ── FORM (hidden after generation) ── */}
        {!roadmapText && !generating && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Create Your Roadmap</h2>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Goal */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Learning Goal <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.goal}
                  onChange={e => handleChange('goal', e.target.value)}
                  placeholder="E.g., Become a MERN Stack developer in 6 months"
                  rows={3}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Level */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Current Level
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {levels.map(l => (
                    <button
                      key={l.value}
                      type="button"
                      onClick={() => handleChange('level', l.value)}
                      className={`py-4 px-3 rounded-xl border-2 text-center transition-all ${
                        formData.level === l.value
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                          : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-2xl mb-1">{l.emoji}</div>
                      <div className="text-sm font-semibold">{l.label}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Qualification */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Qualification / Education Level <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.qualification}
                  onChange={e => handleChange('qualification', e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                >
                  <option value="" disabled>Select your highest qualification</option>
                  {qualificationOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>

              {/* Other qualification */}
              {formData.qualification === 'other' && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Please specify <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.qualificationOther}
                    onChange={e => handleChange('qualificationOther', e.target.value)}
                    placeholder="Describe your qualification..."
                    required
                    className="w-full px-4 py-3 border border-indigo-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  />
                </div>
              )}

              {/* Knowledge Rating */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  How much do you already know about this topic?
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-500">1 — Know nothing</span>
                    <div className="flex items-center gap-1 bg-indigo-50 border border-indigo-200 rounded-full px-4 py-1.5">
                      <span className="text-2xl font-bold text-indigo-600">{formData.knowledgeRating}</span>
                      <span className="text-gray-400 text-sm">/10</span>
                    </div>
                    <span className="text-sm text-gray-500">10 — Expert</span>
                  </div>
                  <input
                    type="range" min="1" max="10"
                    value={formData.knowledgeRating}
                    onChange={e => handleChange('knowledgeRating', parseInt(e.target.value))}
                    className="w-full accent-indigo-600 mb-4"
                  />
                  <div className="flex gap-1.5 justify-between mb-3">
                    {Array.from({ length: 10 }, (_, i) => (
                      <button
                        key={i + 1} type="button"
                        onClick={() => handleChange('knowledgeRating', i + 1)}
                        className={`w-8 h-8 rounded-full text-xs font-bold border-2 transition-all ${
                          formData.knowledgeRating === i + 1
                            ? 'bg-indigo-600 border-indigo-600 text-white'
                            : 'bg-white border-gray-200 text-gray-500 hover:border-indigo-300'
                        }`}
                      >{i + 1}</button>
                    ))}
                  </div>
                  <p className="text-center text-sm text-indigo-600 font-medium italic">
                    "{ratingLabels[formData.knowledgeRating - 1]}"
                  </p>
                </div>
              </div>

              {/* Extra Description */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Additional Details <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={formData.extraDescription}
                  onChange={e => handleChange('extraDescription', e.target.value)}
                  placeholder="Any extra details... e.g. preferred learning style, specific topics, tools you already use, etc."
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={!isValid}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Target className="w-5 h-5" />
                Generate AI Roadmap
                <ChevronRight className="w-5 h-5" />
              </button>

            </form>
          </div>
        )}

        {/* ── LOADING STATE ── */}
        {generating && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm mb-6">
            <Loader2 className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
            <h3 className="text-lg font-bold text-gray-900 mb-1">Generating your roadmap...</h3>
            <p className="text-gray-500 text-sm">Gemini AI is building your personalized plan</p>
          </div>
        )}

        {/* ── ERROR ── */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 mb-6 text-red-700 text-sm font-medium">
            ⚠️ {error}
            <button onClick={handleRegenerate} className="ml-3 underline text-red-500">Try again</button>
          </div>
        )}

        {/* ── PROFILE SUMMARY CARD (shown after generation) ── */}
        {roadmapText && submittedProfile && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-6">
            <h2 className="text-base font-bold text-gray-700 mb-4">📋 Your Profile</h2>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-xl p-3.5">
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1">Goal</p>
                <p className="text-gray-800 font-medium">{submittedProfile.goal}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3.5">
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1">Level</p>
                <p className="text-gray-800 font-medium">
                  {levelEmoji[submittedProfile.level]} {submittedProfile.level.charAt(0).toUpperCase() + submittedProfile.level.slice(1)}
                </p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3.5">
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1">Qualification</p>
                <p className="text-gray-800 font-medium">{submittedProfile.qualification}</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3.5">
                <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1">Knowledge</p>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-xl font-bold text-indigo-600">{submittedProfile.knowledgeRating}</span>
                  <span className="text-gray-400 text-xs">/10 — {ratingLabels[submittedProfile.knowledgeRating - 1]}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── ROADMAP OUTPUT ── */}
        {roadmapText && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Sparkles className="w-6 h-6 text-white" />
                <div>
                  <h2 className="text-white font-bold text-lg">Your Personalized Roadmap</h2>
                  <p className="text-indigo-200 text-sm">Generated by Gemini AI</p>
                </div>
              </div>
              <button
                onClick={handleRegenerate}
                className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate
              </button>
            </div>
            <div className="p-6 pb-8">
              <RoadmapRenderer text={roadmapText} />

              {/* Save Button */}
           <div className="mt-8 pt-6 border-t border-gray-100 flex items-center justify-end gap-3">
  
  {/* Success message */}
  {saveSuccess && (
    <span className="flex items-center gap-1.5 text-green-600 text-sm font-medium">
      <Check className="w-4 h-4" />
      Saved successfully!
    </span>
  )}

  <button
    onClick={async () => {
      setSaving(true);
      setSaveSuccess(false);
      try {
        await axios.post('/ai/save_roadmap', {
          goal: submittedProfile.goal,
          ai_res: roadmapText,
        });
        setSaveSuccess(true);
        // Auto-hide after 3 seconds
        setTimeout(() => setSaveSuccess(false), 3000);
      } catch (err) {
        alert(err?.response?.data?.message || 'Failed to save roadmap.');
      } finally {
        setSaving(false);
      }
    }}
    disabled={saving || saveSuccess}
    className="flex items-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:from-green-600 hover:to-emerald-700 transition-all shadow-sm disabled:opacity-70 disabled:cursor-not-allowed"
  >
    {saving ? (
      <>
        <Loader2 className="w-4 h-4 animate-spin" />
        Saving...
      </>
    ) : saveSuccess ? (
      <>
        <Check className="w-4 h-4" />
        Saved!
      </>
    ) : (
      <>💾 Save Roadmap</>
    )}
  </button>

</div>
            </div>
          </div>
        )}

        {/* ── EMPTY STATE ── */}
        {!roadmapText && !generating && !error && (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
            <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Roadmap Yet</h3>
            <p className="text-gray-500 text-sm">Fill in the form above and click "Generate AI Roadmap"</p>
          </div>
        )}

      </div>
    </div>
  );
};

export default AIRoadmapGenerator;