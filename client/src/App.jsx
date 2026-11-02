import { useEffect, useMemo, useState } from 'react';
import axios from 'axios';

const API_BASE = '/api';

const INITIAL_FORM = {
  name: '',
  email: '',
  password: '',
};

const STUDY_GUIDES = [
  {
    id: 'road-signs',
    title: 'Road Signs & Signals',
    category: 'SIGN KNOWLEDGE',
    length: '8 min read',
    cover: 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=480&q=80',
    description: 'Recognize warning, regulatory, and information signs, and respond safely to traffic signals.',
    lessons: [
      { title: 'Warning signs', text: 'Warning signs alert you to hazards or changes ahead, such as bends, crossings, or roadworks. Reduce speed when the view or road conditions call for it.' },
      { title: 'Regulatory signs', text: 'Regulatory signs communicate rules such as speed limits, prohibited turns, or required directions. Follow the instruction shown and check local road rules.' },
      { title: 'Signals and temporary signs', text: 'Obey traffic lights, crossing signals, and temporary roadwork directions. If signals are out or unclear, slow down and proceed only when it is safe and lawful.' },
    ],
  },
  {
    id: 'road-rules',
    title: 'Road Rules & Right of Way',
    category: 'ROAD RULES',
    length: '10 min read',
    cover: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=480&q=80',
    description: 'Build confidence at junctions, roundabouts, crossings, and when sharing the road.',
    lessons: [
      { title: 'Junctions and priority', text: 'Approach junctions at a speed that lets you stop. Check signs, markings, and approaching traffic; never assume another road user has seen you.' },
      { title: 'Pedestrian crossings', text: 'Watch for people waiting to cross and be ready to stop. Give way as required by your local rules and never overtake a vehicle stopped at a crossing.' },
      { title: 'Sharing the road', text: 'Leave room for cyclists, motorcyclists, and large vehicles. Check mirrors and blind spots before turning or changing lanes, and signal in good time.' },
    ],
  },
  {
    id: 'safe-driving',
    title: 'Safe & Responsible Driving',
    category: 'ROAD SAFETY',
    length: '7 min read',
    cover: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?auto=format&fit=crop&w=480&q=80',
    description: 'Learn defensive driving habits, safe following distances, and how to manage distractions.',
    lessons: [
      { title: 'Space and speed', text: 'Choose a speed that fits the road, visibility, weather, and traffic. Keep enough following distance to stop smoothly if the vehicle ahead slows suddenly.' },
      { title: 'Stay focused', text: 'Driving requires your full attention. Set navigation and music before moving, put away distractions, and never drive when impaired or too tired.' },
      { title: 'Plan for hazards', text: 'Scan well ahead and check mirrors regularly. Ease off early when you see a developing hazard, leaving time and space to respond without abrupt action.' },
    ],
  },
  {
    id: 'vehicle-control',
    title: 'Vehicle Control & Emergencies',
    category: 'PRACTICAL SKILLS',
    length: '9 min read',
    cover: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=480&q=80',
    description: 'Prepare for changing conditions, skids, breakdowns, and emergency vehicles.',
    lessons: [
      { title: 'Control in poor conditions', text: 'Rain, gravel, and low visibility reduce grip and stopping distance. Slow down, make gentle steering and braking inputs, and increase the space around your vehicle.' },
      { title: 'If the vehicle skids', text: 'Avoid sudden braking or sharp steering. Ease off the accelerator and steer smoothly in the direction you want the vehicle to travel.' },
      { title: 'Breakdowns and emergency vehicles', text: 'If you break down, move to a safe place if possible and use the appropriate warning signals. Give approaching emergency vehicles a clear path while following local law.' },
    ],
  },
];

function App() {
  const [mode, setMode] = useState(() => {
    const storedToken = localStorage.getItem('dles-token');
    const storedUser = JSON.parse(localStorage.getItem('dles-user') || 'null');
    if (!storedToken || !storedUser) return 'auth';
    return storedUser.role === 'admin' ? 'admin' : 'dashboard';
  });
  const [form, setForm] = useState(INITIAL_FORM);
  const [authMode, setAuthMode] = useState('login');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [results, setResults] = useState([]);
  const [adminStats, setAdminStats] = useState(null);
  const [activeGuide, setActiveGuide] = useState(null);
  const [completedGuides, setCompletedGuides] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('dles-completed-guides') || '[]');
    } catch {
      return [];
    }
  });
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('dles-user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('dles-token') || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isLoggedIn = Boolean(token && user);

  const questionsLoaded = useMemo(() => questions.length > 0, [questions]);

  const fetchQuestions = async () => {
    try {
      const response = await axios.get(`${API_BASE}/questions`);
      setQuestions(response.data.questions || []);
    } catch (err) {
      setError('Unable to load the exam questions. Please try again.');
    }
  };

  const fetchResults = async (candidateId) => {
    try {
      const response = await axios.get(`${API_BASE}/results/${candidateId}`);
      setResults(response.data.results || []);
    } catch (err) {
      setError('Unable to load your results right now.');
    }
  };

  const fetchAdminStats = async () => {
    try {
      const response = await axios.get(`${API_BASE}/admin/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAdminStats(response.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Admin access is required.');
    }
  };

  useEffect(() => {
    fetchQuestions();
  }, []);

  useEffect(() => {
    if (isLoggedIn && user?.role === 'candidate') {
      fetchResults(user.id);
    }

    if (isLoggedIn && user?.role === 'admin') {
      fetchAdminStats();
    }
  }, [token, user]);

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const handleAuthSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    try {
      const endpoint = authMode === 'login' ? '/auth/login' : '/auth/register';
      const payload = authMode === 'login'
        ? { email: form.email, password: form.password }
        : { name: form.name, email: form.email, password: form.password };

      const response = await axios.post(`${API_BASE}${endpoint}`, payload);
      const { token: nextToken, user: nextUser } = response.data;

      localStorage.setItem('dles-token', nextToken);
      localStorage.setItem('dles-user', JSON.stringify(nextUser));
      setToken(nextToken);
      setUser(nextUser);
      setMode(nextUser.role === 'admin' ? 'admin' : 'dashboard');
      setForm(INITIAL_FORM);
      setResult(null);
      setAnswers({});
    } catch (err) {
      setError(err.response?.data?.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleExamSubmit = async () => {
    if (!isLoggedIn) {
      setError('Please log in before starting the examination.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await axios.post(
        `${API_BASE}/exams/submit`,
        { candidateId: user.id, answers },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setResult(response.data);
      setMode('results');
      fetchResults(user.id);
    } catch (err) {
      setError(err.response?.data?.message || 'The exam could not be submitted.');
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('dles-token');
    localStorage.removeItem('dles-user');
    setToken('');
    setUser(null);
    setQuestions([]);
    setAnswers({});
    setResult(null);
    setResults([]);
    setAdminStats(null);
    setMode('auth');
  };

  const resetExam = () => {
    setAnswers({});
    setResult(null);
    setMode('dashboard');
  };

  const openGuide = (guideId) => {
    setActiveGuide(STUDY_GUIDES.find((guide) => guide.id === guideId) || null);
    setMode('library');
  };

  const markGuideComplete = (guideId) => {
    const nextCompleted = completedGuides.includes(guideId)
      ? completedGuides
      : [...completedGuides, guideId];
    setCompletedGuides(nextCompleted);
    localStorage.setItem('dles-completed-guides', JSON.stringify(nextCompleted));
    setMode('dashboard');
  };

  const candidateNavigation = () => (
    <nav className="candidate-nav" aria-label="Candidate navigation">
      <button type="button" className={mode === 'dashboard' ? 'selected' : ''} onClick={() => setMode('dashboard')}>Overview</button>
      <button type="button" className={mode === 'library' ? 'selected' : ''} onClick={() => { setActiveGuide(null); setMode('library'); }}>Study library</button>
      <button type="button" className={mode === 'exam' ? 'selected' : ''} onClick={() => setMode('exam')}>Practice exam</button>
      <button type="button" className={mode === 'results' ? 'selected' : ''} onClick={() => setMode('results')}>My results</button>
    </nav>
  );

  const renderCandidateHeader = (eyebrow, title) => (
    <>
      <header className="candidate-header">
        <a className="brand-lockup" href="#dashboard" onClick={(event) => { event.preventDefault(); setMode('dashboard'); }} aria-label="DLES dashboard">
          <span className="brand-mark">D</span>
          <span>DLES<span className="brand-subtitle">CANDIDATE PORTAL</span></span>
        </a>
        <div className="candidate-account">
          <span className="account-avatar">{user?.name?.charAt(0)?.toUpperCase() || 'C'}</span>
          <span className="account-name">{user?.name}</span>
          <button type="button" className="ghost-btn" onClick={logout}>Log out</button>
        </div>
      </header>
      {candidateNavigation(mode)}
      <div className="page-heading">
        <div><span className="eyebrow">{eyebrow}</span><h1>{title}</h1></div>
      </div>
    </>
  );

  const renderCandidateDashboard = () => {
    const latestResult = results[results.length - 1];
    const progressPercent = Math.round((completedGuides.length / STUDY_GUIDES.length) * 100);

    return (
      <main className="candidate-page">
        {renderCandidateHeader('YOUR LEARNING SPACE', `Welcome${user?.name ? `, ${user.name.split(' ')[0]}` : ''}`)}
        <section className="dashboard-hero">
          <div className="hero-copy">
            <span className="hero-kicker">PREPARE WITH PURPOSE</span>
            <h2>Good driving starts with what you know.</h2>
            <p>Build your road knowledge with short study guides, then check your readiness with a practice exam.</p>
            <button type="button" className="light-btn" onClick={() => setMode('library')}>Explore study guides <span aria-hidden="true">→</span></button>
          </div>
          <div className="road-art" aria-hidden="true">
            <img className="hero-road" src="https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1100&q=85" alt="" />
            <div className="hero-road-shade" />
            <img className="hero-car" src="https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=900&q=85" alt="" />
            <div className="road-sign"><span>LEARN</span><strong>01</strong></div>
          </div>
        </section>

        <section className="dashboard-stats" aria-label="Your learning progress">
          <div><span className="stat-label">GUIDES COMPLETED</span><strong>{completedGuides.length}<small> / {STUDY_GUIDES.length}</small></strong><div className="progress-track"><span style={{ width: `${progressPercent}%` }} /></div></div>
          <div><span className="stat-label">EXAMS TAKEN</span><strong>{results.length}</strong><span className="stat-note">Practice at your own pace</span></div>
          <div><span className="stat-label">LATEST SCORE</span><strong>{latestResult ? `${latestResult.percentage}%` : '--'}</strong><span className="stat-note">{latestResult ? (latestResult.passed ? 'Passed' : 'Keep practicing') : 'Your first attempt is waiting'}</span></div>
        </section>

        <section className="content-section">
          <div className="section-heading"><div><span className="eyebrow">START LEARNING</span><h2>Study guides</h2></div><button type="button" className="text-link" onClick={() => setMode('library')}>View all <span aria-hidden="true">→</span></button></div>
          <div className="guide-grid">
            {STUDY_GUIDES.slice(0, 3).map((guide, index) => (
              <button type="button" className={`guide-card guide-tone-${index + 1}`} key={guide.id} onClick={() => openGuide(guide.id)}>
                <span className="book-cover">
                  <img src={guide.cover} alt={`${guide.title} study guide cover`} loading="lazy" />
                  <span className="cover-shade" />
                  <span className="cover-copy"><small>{guide.category}</small><strong>{guide.title}</strong></span>
                  <span className="cover-edition">DLES · STUDY SERIES</span>
                </span>
                <span className="guide-card-top"><span>{guide.category}</span><span aria-hidden="true">↗</span></span>
                <span className="guide-title">{guide.title}</span>
                <span className="guide-description">{guide.description}</span>
                <span className="guide-card-bottom"><span>{guide.length}</span><span>{completedGuides.includes(guide.id) ? 'COMPLETED' : 'OPEN GUIDE'}</span></span>
              </button>
            ))}
          </div>
        </section>

        <section className="exam-callout">
          <div><span className="eyebrow">READY TO CHECK YOUR KNOWLEDGE?</span><h2>Take a practice exam</h2><p>Answer the theory questions and get your result as soon as you submit.</p></div>
          <button type="button" className="primary-btn" onClick={() => setMode('exam')}>Start practice exam <span aria-hidden="true">→</span></button>
        </section>
        <p className="licensing-note">Practice results are for learning purposes. Official licensing steps and requirements are set by your local authority.</p>
      </main>
    );
  };

  const renderStudyLibrary = () => (
    <main className="candidate-page">
      {renderCandidateHeader('BUILD YOUR KNOWLEDGE', 'Study library')}
      {activeGuide ? (
        <article className="lesson-page">
          <button type="button" className="back-link" onClick={() => { setActiveGuide(null); setMode('library'); }}>← All study guides</button>
          <div className="lesson-intro"><span className="eyebrow">{activeGuide.category} · {activeGuide.length}</span><h2>{activeGuide.title}</h2><p>{activeGuide.description}</p></div>
          <div className="lesson-list">
            {activeGuide.lessons.map((lesson, index) => <section className="lesson-block" key={lesson.title}><span className="lesson-number">0{index + 1}</span><div><h3>{lesson.title}</h3><p>{lesson.text}</p></div></section>)}
          </div>
          <div className="lesson-actions"><button type="button" className="ghost-btn" onClick={() => setMode('dashboard')}>Back to overview</button><button type="button" className="primary-btn" onClick={() => markGuideComplete(activeGuide.id)}>{completedGuides.includes(activeGuide.id) ? 'Completed' : 'Mark as read'}</button></div>
        </article>
      ) : (
        <>
          <p className="library-intro">Choose a guide to review key ideas before your practice exam. Your reading progress is saved on this device.</p>
          <div className="guide-grid library-grid">{STUDY_GUIDES.map((guide, index) => (
            <button type="button" className={`guide-card guide-tone-${(index % 3) + 1}`} key={guide.id} onClick={() => openGuide(guide.id)}>
              <span className="book-cover">
                <img src={guide.cover} alt={`${guide.title} study guide cover`} loading="lazy" />
                <span className="cover-shade" />
                <span className="cover-copy"><small>{guide.category}</small><strong>{guide.title}</strong></span>
                <span className="cover-edition">DLES · STUDY SERIES</span>
              </span>
              <span className="guide-card-top"><span>{guide.category}</span><span aria-hidden="true">↗</span></span><span className="guide-title">{guide.title}</span><span className="guide-description">{guide.description}</span><span className="guide-card-bottom"><span>{guide.length}</span><span>{completedGuides.includes(guide.id) ? 'COMPLETED' : 'OPEN GUIDE'}</span></span>
            </button>
          ))}</div>
          <div className="library-exam-link"><span>Finished reviewing?</span><button type="button" className="text-link" onClick={() => setMode('exam')}>Go to practice exam →</button></div>
        </>
      )}
    </main>
  );

  const renderAuthScreen = () => (
    <div className="auth-wrap">
      <div className="panel single-panel">
        <div className="panel-header">
          <span className="badge">DLES</span>
          <h1>Driving License Exam System</h1>
        </div>

        <div className="switcher">
          <button
            type="button"
            className={authMode === 'login' ? 'active' : ''}
            onClick={() => setAuthMode('login')}
          >
            Login
          </button>
          <button
            type="button"
            className={authMode === 'register' ? 'active' : ''}
            onClick={() => setAuthMode('register')}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleAuthSubmit} className="auth-form">
          {authMode === 'register' && (
            <label>
              Full name
              <input type="text" name="name" value={form.name} onChange={handleInputChange} required />
            </label>
          )}

          <label>
            Email address
            <input type="email" name="email" value={form.email} onChange={handleInputChange} required />
          </label>

          <label>
            Password
            <input type="password" name="password" value={form.password} onChange={handleInputChange} required />
          </label>

          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Please wait...' : authMode === 'login' ? 'Log in' : 'Create account'}
          </button>
        </form>

        <div className="demo-box">
          <p><strong>Demo candidate:</strong> candidate@dles.com / Candidate@123</p>
          <p><strong>Demo admin:</strong> admin@dles.com / Admin@123</p>
        </div>
      </div>
    </div>
  );

  const renderExamScreen = () => (
    <div className="exam-page">
      <div className="topbar">
        <div>
          <span className="badge">Candidate portal</span>
          <h2>Driving Theory Exam</h2>
        </div>
        <button type="button" onClick={() => setMode('dashboard')} className="ghost-btn">Dashboard</button>
      </div>

      <div className="exam-meta">
        <span>{questions.length} questions</span>
        <span>Pass mark: 70%</span>
      </div>

      {!questionsLoaded ? (
        <div className="panel">Loading questions...</div>
      ) : (
        <div className="question-stack">
          {questions.map((question, index) => (
            <div className="panel question-card" key={question.id}>
              <h3>
                {index + 1}. {question.text}
              </h3>
              <div className="options">
                {question.options.map((option, optionIndex) => (
                  <label key={`${question.id}-${optionIndex}`} className="option-row">
                    <input
                      type="radio"
                      name={question.id}
                      checked={Number(answers[question.id]) === optionIndex}
                      onChange={() => setAnswers((current) => ({ ...current, [question.id]: optionIndex }))}
                    />
                    <span>{option}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="action-row">
        <button type="button" className="primary-btn" onClick={handleExamSubmit} disabled={loading || !questionsLoaded}>
          {loading ? 'Submitting...' : 'Submit Exam'}
        </button>
      </div>
    </div>
  );

  const renderResultsScreen = () => (
    <div className="results-page">
      <div className="topbar">
        <div>
          <span className="badge">Results</span>
          <h2>Exam Outcome</h2>
        </div>
        <button type="button" onClick={() => setMode('dashboard')} className="ghost-btn">Dashboard</button>
      </div>

      {result && (
        <div className="panel result-summary">
          <h3>{result.passed ? 'Pass' : 'Fail'}</h3>
          <p>Score: {result.correct}/{result.totalQuestions}</p>
          <p>Percentage: {result.percentage}%</p>
          <p>{result.message}</p>
          <button type="button" className="primary-btn" onClick={resetExam}>Retry Exam</button>
        </div>
      )}

      <div className="panel">
        <h3>Result history</h3>
        {results.length === 0 ? (
          <p>No results available yet.</p>
        ) : (
          <ul className="result-list">
            {results.map((entry) => (
              <li key={entry.id}>
                <span>{new Date(entry.submittedAt).toLocaleDateString()}</span>
                <strong>{entry.percentage}%</strong>
                <em>{entry.passed ? 'Passed' : 'Failed'}</em>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );

  const renderAdminScreen = () => (
    <div className="admin-page">
      <div className="topbar">
        <div>
          <span className="badge">Admin</span>
          <h2>Administrator Dashboard</h2>
        </div>
        <button type="button" onClick={logout} className="ghost-btn">Logout</button>
      </div>

      <div className="stats-grid">
        <div className="panel stat-box">
          <h3>Total candidates</h3>
          <p>{adminStats?.totalCandidates ?? 0}</p>
        </div>
        <div className="panel stat-box">
          <h3>Exams taken</h3>
          <p>{adminStats?.testsTaken ?? 0}</p>
        </div>
        <div className="panel stat-box">
          <h3>Pass rate</h3>
          <p>{adminStats?.passRate ?? 0}%</p>
        </div>
        <div className="panel stat-box">
          <h3>Average score</h3>
          <p>{adminStats?.averageScore ?? 0}%</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="app-shell">
      {error && <div className="error-banner">{error}</div>}

      {!isLoggedIn && renderAuthScreen()}
      {isLoggedIn && user?.role === 'candidate' && mode === 'dashboard' && renderCandidateDashboard()}
      {isLoggedIn && user?.role === 'candidate' && mode === 'library' && renderStudyLibrary()}
      {isLoggedIn && user?.role === 'candidate' && mode === 'exam' && renderExamScreen()}
      {isLoggedIn && user?.role === 'candidate' && mode === 'results' && renderResultsScreen()}
      {isLoggedIn && user?.role === 'admin' && renderAdminScreen()}
    </div>
  );
}

export default App;
