import { useState } from "react";
import { Sparkles, Target, RefreshCw } from "lucide-react";

const dummyResponse = `Phase 1: The JavaScript Foundation (Month 1)
Before touching the "MERN" components, you must master the language they all share.
* **HTML5 & Modern CSS:** Learn semantic HTML and layout systems like Flexbox and Grid. Focus on responsive design so your apps look good on mobile.
* **JavaScript ES6+:** Deep dive into arrow functions, destructuring, template literals, and the Spread/Rest operators.
* **Asynchronous JS:** This is the heart of Node.js. Master Promises and \`Async/Await\` to handle data fetching without "callback hell."
* **Git & GitHub:** Learn basic version control (commit, push, pull, branch) to manage your code professionally.

Phase 2: React.js – The Frontend (Month 2)
React is the "R" in MERN and handles the user interface.
* **Components & Props:** Learn how to break a UI into reusable pieces and pass data between them.
* **Hooks (useState, useEffect):** Master these for managing local state and handling side effects like API calls.
* **State Management:** Start with the Context API for simple apps, then move to Redux Toolkit or Zustand for complex data.
* **React Router:** Learn client-side routing to create a Multi-Page Experience within a Single Page Application (SPA).

Phase 3: Node.js & Express.js – The Backend (Month 3)
These represent the "N" and "E," forming the server-side of your application.
* **Node.js Runtime:** Understand the event loop and how JavaScript runs outside the browser.
* **Express Framework:** Learn to set up a server, handle different HTTP methods (GET, POST, PUT, DELETE), and use Middleware.
* **RESTful APIs:** Build structured endpoints that your React frontend can "talk" to.
* **Error Handling:** Implement global error handlers to ensure your server doesn't crash on every bug.

Phase 4: MongoDB & Database Design (Month 4)
The "M" is where your application's data lives.
* **NoSQL Basics:** Understand collections and documents (JSON-like format) vs. traditional tables.
* **Mongoose ORM:** Use Mongoose to create Schemas and Models, giving your NoSQL data a predictable structure.
* **CRUD Operations:** Perform Create, Read, Update, and Delete actions from your Express server to MongoDB.
* **Data Modeling:** Learn how to relate different data sets (e.g., linking a "Post" to a "User").

Phase 5: Authentication & Security (Month 5)
This month turns a "toy app" into a "real application."
* **JWT (JSON Web Tokens):** Implement secure logins where the server issues a token to the user.
* **Bcrypt:** Learn to hash passwords so you never store plain text in your database.
* **Authorization:** Create private routes that only logged-in users or "Admins" can see.
* **Security Best Practices:** Use \`Helmet.js\` for headers and implement CORS to control which frontends can access your API.

Phase 6: Deployment & Final Portfolio Project (Month 6)
The final month is about making your work public and visible to employers.
* **Deployment:** Host your frontend on Vercel or Netlify and your backend/database on Render or Railway.
* **Cloudinary/AWS S3:** Learn to handle file uploads like profile pictures since databases shouldn't store large images.
* **The Capstone Project:** Build a full-scale application like an E-commerce store or a Social Media dashboard.
* **Portfolio Building:** Document your projects on GitHub with professional \`README.md\` files.

Would you like me to generate a specific 12-week syllabus with weekly coding assignments for you?`;

const phaseColors = [
  "from-indigo-500 to-indigo-600",
  "from-purple-500 to-purple-600",
  "from-blue-500 to-blue-600",
  "from-violet-500 to-violet-600",
  "from-fuchsia-500 to-fuchsia-600",
  "from-sky-500 to-sky-600",
];

const phaseIconBg = [
  "bg-indigo-100 text-indigo-600",
  "bg-purple-100 text-purple-600",
  "bg-blue-100 text-blue-600",
  "bg-violet-100 text-violet-600",
  "bg-fuchsia-100 text-fuchsia-600",
  "bg-sky-100 text-sky-600",
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
      // Description line right after heading
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

export default function RoadmapPreview() {
  const [show, setShow] = useState(true);

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

        {/* Profile summary card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm mb-6">
          <h2 className="text-base font-bold text-gray-700 mb-4">📋 Your Profile</h2>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="bg-gray-50 rounded-xl p-3.5">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1">Goal</p>
              <p className="text-gray-800 font-medium">Become a MERN Stack developer in 6 months</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3.5">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1">Level</p>
              <p className="text-gray-800 font-medium">🌱 Beginner</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3.5">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1">Qualification</p>
              <p className="text-gray-800 font-medium">Postgraduate (Master's)</p>
            </div>
            <div className="bg-gray-50 rounded-xl p-3.5">
              <p className="text-gray-400 text-xs font-semibold uppercase tracking-wide mb-1">Knowledge</p>
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl font-bold text-indigo-600">4</span>
                <span className="text-gray-400 text-xs">/10 — Some concepts</span>
              </div>
            </div>
          </div>
        </div>

        {/* Roadmap output */}
        {show ? (
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
                onClick={() => setShow(false)}
                className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 text-white text-sm px-3 py-1.5 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Regenerate
              </button>
            </div>
            <div className="p-6 pb-8">
              <RoadmapRenderer text={dummyResponse} />
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center shadow-sm">
            <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No Roadmap Yet</h3>
            <p className="text-gray-500 text-sm mb-5">Fill in the form and generate your roadmap</p>
            <button
              onClick={() => setShow(true)}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-xl font-semibold text-sm hover:from-indigo-700 hover:to-purple-700 transition-all"
            >
              Preview Roadmap
            </button>
          </div>
        )}
      </div>
    </div>
  );
}