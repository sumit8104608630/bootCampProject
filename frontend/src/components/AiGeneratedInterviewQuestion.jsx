import { useState, useRef } from 'react';
import { pdfjs } from 'react-pdf';
import axios from "../../utils/axios";

// Configure PDF.js worker using the version from react-pdf
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

import {
  FileText, Upload, X, Sparkles, Loader2, AlertCircle,
  CheckCircle2, ChevronDown, ChevronUp, ClipboardList,
  MessageSquare, RefreshCw, Download, Image
} from 'lucide-react';

const MAX_FILE_SIZE_MB = 1024;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

export default function AIGeneratedInterviewQuestion() {
  const [topic, setTopic] = useState('');
  const [selectedFile, setSelectedFile] = useState(null); // Rename for clarity (PDF or Image)
  const [fileBase64, setFileBase64] = useState(null);
  const [fileMimeType, setFileMimeType] = useState(null);
  const [pdfText, setPdfText] = useState('');
  const [questionType, setQuestionType] = useState('interview'); // 'interview' | 'mcq'
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState(null);
  const [error, setError] = useState('');
  const [fileError, setFileError] = useState('');
  const [expandedIdx, setExpandedIdx] = useState(null);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const fileInputRef = useRef(null);

  const extractTextFromPdf = async (file) => {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
      const pdf = await loadingTask.promise;
      let fullText = '';
      
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent({ normalizeWhitespace: true });
        const pageText = textContent.items
          .map(item => {
            // Remove control characters and non-printable characters like \u0000
            return (item.str || '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F-\x9F]/g, "");
          })
          .join(' ')
          .replace(/\s+/g, ' '); // normalize spaces
        fullText += pageText + '\n';
      }
      
      return fullText;
    } catch (err) {
      console.error('Error extracting text from PDF:', err);
      // Don't throw here, just return empty text if extraction fails (e.g. scanned PDF)
      return '';
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    setFileError('');
    if (!file) return;

    const allowedTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setFileError('Only PDF and image files (PNG, JPG, WEBP) are allowed.');
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError(`File size must be under ${MAX_FILE_SIZE_MB}MB.`);
      return;
    }

    try {
      setLoading(true);
      
      // Convert to base64 for backend (Gemini Vision/PDF support)
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result.split(',')[1];
        setFileBase64(base64);
        setFileMimeType(file.type);
        
        // If it's a PDF, try to extract text as well for better context
        let text = '';
        if (file.type === 'application/pdf') {
          text = await extractTextFromPdf(file);
          setPdfText(text);
          console.log('--- ENTIRE PDF TEXT START ---');
          console.log(text || 'No text content found (likely a scanned PDF)');
          console.log('--- ENTIRE PDF TEXT END ---');
        } else {
          setPdfText('');
        }
        
        setSelectedFile(file);
        setLoading(false);
      };
      reader.readAsDataURL(file);
      
    } catch (err) {
      setFileError('Error processing file. Please try again.');
      setLoading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setFileBase64(null);
    setFileMimeType(null);
    setPdfText('');
    setFileError('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const buildPrompt = () => {
    const topicLine = topic.trim()
      ? `Topic: "${topic.trim()}".`
      : 'Use the content from the uploaded file as the topic.';

    const contextLine = pdfText 
      ? `\n\nContext from file (extracted text): \n${pdfText}\n\n`
      : '\n\nPlease analyze the uploaded file (image/PDF) to understand the topic and content.\n\n';

    if (questionType === 'mcq') {
      return `You are an expert quiz creator. ${topicLine}${contextLine}
Generate exactly 8 multiple choice questions.
Respond ONLY with a valid JSON array (no markdown, no extra text) in this format:
[
  {
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "answer": "Option A",
    "explanation": "Brief explanation why this is correct."
  }
]`;
    } else {
      return `You are an expert technical interviewer. ${topicLine}${contextLine}
Generate exactly 8 interview questions with detailed model answers.
Respond ONLY with a valid JSON array (no markdown, no extra text) in this format:
[
  {
    "question": "Interview question here?",
    "difficulty": "Easy | Medium | Hard",
    "answer": "Detailed model answer here.",
    "tip": "A short tip for answering this well."
  }
]`;
    }
  };

  const handleGenerate = async () => {
    // Log all form data on submit
    console.log('Form Data Submitted:', {
      topic,
      fileName: selectedFile ? selectedFile.name : 'None',
      fileType: fileMimeType,
      hasBase64: !!fileBase64,
      pdfText: pdfText || 'None',
      questionType
    });

    if (!topic.trim() && !selectedFile) {
      setError('Please enter a topic or upload a file (PDF/Image).');
      return;
    }
    setError('');
    setQuestions(null);
    setLoading(true);
    setExpandedIdx(null);

    try {
      const prompt = buildPrompt();

      // Call the requested endpoint
      const response = await axios.post('/aiquestion/generateQuestions', 
        { 
          goal: topic || (selectedFile ? selectedFile.name : 'Uploaded File'),
          type: questionType === 'mcq' ? 'MCQ Quiz' : 'Interview Questions',
          paragraph: pdfText,
          prompt,
          fileData: fileBase64,
          mimeType: fileMimeType
        },
        { withCredentials: true }
      );

      if (response.data.success) {
        const rawText = response.data.data;
        const parsed = JSON.parse(rawText);
        setQuestions(parsed);
      } else {
        throw new Error(response.data.message || 'Failed to generate questions');
      }
    } catch (err) {
      if (err.response?.status === 429) {
        setError('your token has expired');
        setShowErrorModal(true);
      } else {
        setError('Failed to generate questions. Please try again.');
      }
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setQuestions(null);
    setExpandedIdx(null);
  };

  const difficultyColor = (d) => {
    if (!d) return 'bg-gray-100 text-gray-600';
    const lower = d.toLowerCase();
    if (lower === 'easy') return 'bg-green-100 text-green-700';
    if (lower === 'medium') return 'bg-yellow-100 text-yellow-700';
    if (lower === 'hard') return 'bg-red-100 text-red-700';
    return 'bg-gray-100 text-gray-600';
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6 sm:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
          AI Interview Questions
        </h1>
        <p className="text-gray-500 text-base sm:text-lg">
          Generate MCQs or interview Q&amp;As from a topic or PDF
        </p>
      </div>

      {/* Generator Card */}
      {!questions && (
        <div className="bg-white rounded-2xl border border-gray-200 p-6 sm:p-8 shadow-sm mb-6">

          {/* Topic Input */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Topic <span className="text-gray-400 font-normal">(optional if uploading PDF)</span>
            </label>
            <input
              type="text"
              value={topic}
              onChange={e => setTopic(e.target.value)}
              placeholder="e.g. React Hooks, Operating Systems, DSA..."
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
            />
          </div>

          {/* PDF/Image Upload */}
          <div className="mb-5">
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Upload File <span className="text-gray-400 font-normal">(optional · max 1024 MB)</span>
            </label>

            {!selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-6 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-all group"
              >
                <div className="w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-indigo-200 transition-colors">
                  <Upload className="w-6 h-6 text-indigo-600" />
                </div>
                <p className="text-sm font-medium text-gray-700">Click to upload PDF or Image</p>
                <p className="text-xs text-gray-400 mt-1">PDF, PNG, JPG, WEBP (Max 1 GB)</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="application/pdf,image/*"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>
            ) : (
              <div className="flex items-center gap-3 border border-indigo-200 bg-indigo-50 rounded-xl px-4 py-3">
                {selectedFile.type.startsWith('image/') ? (
                  <Image className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                ) : (
                  <FileText className="w-5 h-5 text-indigo-600 flex-shrink-0" />
                )}
                <span className="text-sm font-medium text-gray-800 truncate flex-1">{selectedFile.name}</span>
                <span className="text-xs text-gray-500 flex-shrink-0">
                  {selectedFile.size > 1024 * 1024 
                    ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB` 
                    : `${(selectedFile.size / 1024).toFixed(1)} KB`}
                </span>
                <button
                  onClick={handleRemoveFile}
                  className="text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            )}

            {fileError && (
              <p className="mt-2 text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" /> {fileError}
              </p>
            )}
          </div>

          {/* Question Type Toggle */}
          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-700 mb-3">
              Question Type
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setQuestionType('interview')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                  questionType === 'interview'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <MessageSquare className={`w-5 h-5 ${questionType === 'interview' ? 'text-indigo-600' : 'text-gray-400'}`} />
                <div className="text-left">
                  <div className="font-semibold">Interview Q&amp;A</div>
                  <div className="text-xs font-normal text-gray-500">With model answers</div>
                </div>
                {questionType === 'interview' && (
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 ml-auto" />
                )}
              </button>

              <button
                onClick={() => setQuestionType('mcq')}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 font-medium text-sm transition-all ${
                  questionType === 'mcq'
                    ? 'border-indigo-500 bg-indigo-50 text-indigo-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <ClipboardList className={`w-5 h-5 ${questionType === 'mcq' ? 'text-indigo-600' : 'text-gray-400'}`} />
                <div className="text-left">
                  <div className="font-semibold">MCQ Quiz</div>
                  <div className="text-xs font-normal text-gray-500">4 options + answer</div>
                </div>
                {questionType === 'mcq' && (
                  <CheckCircle2 className="w-4 h-4 text-indigo-600 ml-auto" />
                )}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-center gap-2 text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-3 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white px-6 py-3.5 rounded-xl font-semibold hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Generating Questions...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Questions
              </>
            )}
          </button>
        </div>
      )}

      {/* Results */}
      {questions && (
        <div>
          {/* Result Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {questionType === 'mcq' ? 'MCQ Quiz' : 'Interview Questions'}
              </h2>
              <p className="text-sm text-gray-500 mt-0.5">
                {questions.length} questions generated
                {topic ? ` for "${topic}"` : selectedFile ? ` from "${selectedFile.name}"` : ''}
              </p>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 text-sm font-medium transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
              New
            </button>
          </div>

          <div className="space-y-3">
            {questions.map((q, idx) => (
              <div
                key={idx}
                className="bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* Question row */}
                <button
                  onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
                  className="w-full flex items-start gap-4 px-6 py-4 text-left"
                >
                  <span className="w-7 h-7 flex-shrink-0 rounded-full bg-indigo-100 text-indigo-700 text-sm font-bold flex items-center justify-center mt-0.5">
                    {idx + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 leading-snug">{q.question}</p>
                    {q.difficulty && (
                      <span className={`inline-block mt-1.5 text-xs font-semibold px-2.5 py-0.5 rounded-full ${difficultyColor(q.difficulty)}`}>
                        {q.difficulty}
                      </span>
                    )}
                    {/* MCQ options preview */}
                    {questionType === 'mcq' && expandedIdx !== idx && (
                      <div className="mt-2 grid grid-cols-2 gap-1.5">
                        {q.options?.map((opt, oi) => (
                          <span key={oi} className="text-xs text-gray-500 bg-gray-50 rounded-lg px-2 py-1 truncate">
                            {String.fromCharCode(65 + oi)}. {opt}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  {expandedIdx === idx
                    ? <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                    : <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
                  }
                </button>

                {/* Expanded content */}
                {expandedIdx === idx && (
                  <div className="border-t border-gray-100 px-6 py-5 bg-gray-50 space-y-4">
                    {/* MCQ: full options + answer */}
                    {questionType === 'mcq' && (
                      <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {q.options?.map((opt, oi) => {
                            const isCorrect = opt === q.answer;
                            return (
                              <div
                                key={oi}
                                className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium border ${
                                  isCorrect
                                    ? 'bg-green-50 border-green-300 text-green-800'
                                    : 'bg-white border-gray-200 text-gray-700'
                                }`}
                              >
                                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                                  isCorrect ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                                }`}>
                                  {String.fromCharCode(65 + oi)}
                                </span>
                                {opt}
                                {isCorrect && <CheckCircle2 className="w-4 h-4 text-green-600 ml-auto" />}
                              </div>
                            );
                          })}
                        </div>
                        {q.explanation && (
                          <div className="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3">
                            <p className="text-xs font-semibold text-indigo-700 mb-1 uppercase tracking-wide">Explanation</p>
                            <p className="text-sm text-indigo-900">{q.explanation}</p>
                          </div>
                        )}
                      </>
                    )}

                    {/* Interview: model answer + tip */}
                    {questionType === 'interview' && (
                      <>
                        <div className="bg-white border border-gray-200 rounded-xl px-4 py-3">
                          <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Model Answer</p>
                          <p className="text-sm text-gray-800 leading-relaxed">{q.answer}</p>
                        </div>
                        {q.tip && (
                          <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 flex items-start gap-2">
                            <Sparkles className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-xs font-semibold text-amber-700 mb-0.5">Pro Tip</p>
                              <p className="text-sm text-amber-900">{q.tip}</p>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Bottom action */}
          <div className="mt-6 flex justify-center">
            <button
              onClick={handleReset}
              className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-indigo-700 transition-colors"
            >
              <Sparkles className="w-5 h-5" />
              Generate New Questions
            </button>
          </div>
        </div>
      )}
      {/* Error Modal */}
      {showErrorModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-sm w-full p-8 text-center transform animate-in zoom-in-95 duration-200">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-10 h-10 text-red-600" />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">Token Expired</h3>
            <p className="text-gray-600 mb-8 leading-relaxed">
              Your AI generation quota has been reached for now. Please try again later or upgrade your plan.
            </p>
            <button
              onClick={() => setShowErrorModal(false)}
              className="w-full bg-gray-900 text-white py-4 rounded-2xl font-bold hover:bg-gray-800 active:scale-[0.98] transition-all shadow-lg"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}