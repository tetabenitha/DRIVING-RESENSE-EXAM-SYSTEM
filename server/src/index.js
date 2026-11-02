import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

import { initDatabase } from './db.js';
import { inMemoryResults, inMemoryUsers, examQuestions, sanitizeUser, buildQuestionPayload } from './data.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 5000);
const JWT_SECRET = process.env.JWT_SECRET || 'dles-dev-secret';
const PASSING_SCORE = Number(process.env.PASSING_SCORE || 70);
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@dles.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@123';

app.use(cors());
app.use(express.json());

const requestLog = (req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
};

app.use(requestLog);

async function seedDemoAccounts() {
  const adminExists = inMemoryUsers.some((user) => user.email.toLowerCase() === ADMIN_EMAIL.toLowerCase());

  if (!adminExists) {
    const adminPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);
    inMemoryUsers.push({
      id: crypto.randomUUID(),
      name: 'System Administrator',
      email: ADMIN_EMAIL,
      password: adminPassword,
      role: 'admin',
      createdAt: new Date().toISOString()
    });
  }

  const candidateExists = inMemoryUsers.some((user) => user.email.toLowerCase() === 'candidate@dles.com');

  if (!candidateExists) {
    const candidatePassword = await bcrypt.hash('Candidate@123', 10);
    inMemoryUsers.push({
      id: crypto.randomUUID(),
      name: 'Sample Candidate',
      email: 'candidate@dles.com',
      password: candidatePassword,
      role: 'candidate',
      createdAt: new Date().toISOString()
    });
  }
}

function signToken(user) {
  return jwt.sign({ id: user.id, role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '12h' });
}

function getAuthUser(req) {
  const authHeader = req.headers.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    return null;
  }

  try {
    const token = authHeader.replace('Bearer ', '');
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

function computeExamResult(answers) {
  let correct = 0;

  examQuestions.forEach((question) => {
    const selectedOption = Number(answers[question.id]);
    if (!Number.isNaN(selectedOption) && selectedOption === question.correctAnswerIndex) {
      correct += 1;
    }
  });

  const totalQuestions = examQuestions.length;
  const percentage = Math.round((correct / totalQuestions) * 100);
  const passed = percentage >= PASSING_SCORE;

  return {
    correct,
    totalQuestions,
    percentage,
    passed,
    passMark: PASSING_SCORE
  };
}

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', message: 'Driving License Exam System API is running' });
});

app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Name, email and password are required.' });
  }

  if (password.length < 6) {
    return res.status(400).json({ message: 'Password must be at least 6 characters long.' });
  }

  const normalizedEmail = email.toLowerCase();
  const existing = inMemoryUsers.find((user) => user.email.toLowerCase() === normalizedEmail);

  if (existing) {
    return res.status(409).json({ message: 'An account with this email already exists.' });
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const nextUser = {
    id: crypto.randomUUID(),
    name,
    email: normalizedEmail,
    password: hashedPassword,
    role: 'candidate',
    createdAt: new Date().toISOString()
  };

  inMemoryUsers.push(nextUser);

  const token = signToken(nextUser);
  return res.status(201).json({
    token,
    user: sanitizeUser(nextUser)
  });
});

app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required.' });
  }

  const user = inMemoryUsers.find((candidate) => candidate.email.toLowerCase() === email.toLowerCase());

  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const isValidPassword = await bcrypt.compare(password, user.password);

  if (!isValidPassword) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  const token = signToken(user);
  return res.json({
    token,
    user: sanitizeUser(user)
  });
});

app.get('/api/questions', (_req, res) => {
  res.json({ questions: buildQuestionPayload() });
});

app.post('/api/exams/submit', (req, res) => {
  const authUser = getAuthUser(req);
  const candidateId = authUser?.id || req.body.candidateId;
  const answers = req.body.answers || {};

  if (!candidateId) {
    return res.status(401).json({ message: 'Authentication required to submit an exam.' });
  }

  const userExists = inMemoryUsers.some((user) => user.id === candidateId);
  if (!userExists) {
    return res.status(404).json({ message: 'Candidate not found.' });
  }

  const result = computeExamResult(answers);
  const examRecord = {
    id: crypto.randomUUID(),
    candidateId,
    submittedAt: new Date().toISOString(),
    ...result
  };

  inMemoryResults.push(examRecord);

  return res.json({
    ...result,
    message: result.passed ? 'Congratulations! You have passed the exam.' : 'You did not pass this time. Review the results and try again later.',
    resultId: examRecord.id,
    submittedAt: examRecord.submittedAt
  });
});

app.get('/api/results/:candidateId', (req, res) => {
  const { candidateId } = req.params;
  const results = inMemoryResults.filter((result) => result.candidateId === candidateId);
  res.json({ results });
});

app.get('/api/admin/stats', (req, res) => {
  const authUser = getAuthUser(req);

  if (!authUser || authUser.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }

  const totalCandidates = inMemoryUsers.filter((user) => user.role === 'candidate').length;
  const testsTaken = inMemoryResults.length;
  const passedCount = inMemoryResults.filter((result) => result.passed).length;
  const averageScore = testsTaken
    ? Math.round(inMemoryResults.reduce((total, result) => total + result.percentage, 0) / testsTaken)
    : 0;

  return res.json({
    totalCandidates,
    testsTaken,
    passedCount,
    passRate: testsTaken ? Math.round((passedCount / testsTaken) * 100) : 0,
    averageScore
  });
});

app.get('/api/admin/users', (req, res) => {
  const authUser = getAuthUser(req);

  if (!authUser || authUser.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required.' });
  }

  const users = inMemoryUsers.map(sanitizeUser);
  return res.json({ users });
});

async function startServer() {
  await initDatabase();
  await seedDemoAccounts();

  app.listen(PORT, () => {
    console.log(`DLES API listening on http://localhost:${PORT}`);
  });
}

startServer();
