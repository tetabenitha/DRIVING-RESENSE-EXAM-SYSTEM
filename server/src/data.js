export const examQuestions = [
  {
    id: 'q1',
    text: 'What is the legal blood alcohol limit for a learner driver in many countries?',
    options: ['Zero tolerance', '0.08%', '0.02%', '0.10%'],
    correctAnswerIndex: 0,
    category: 'Road safety',
    difficulty: 'easy'
  },
  {
    id: 'q2',
    text: 'What does a red traffic light mean?',
    options: ['Proceed with caution', 'Stop', 'Slow down', 'Give way'],
    correctAnswerIndex: 1,
    category: 'Traffic signs',
    difficulty: 'easy'
  },
  {
    id: 'q3',
    text: 'When approaching a pedestrian crossing, you should:',
    options: ['Sound your horn', 'Speed up', 'Stop and give way', 'Change lanes'],
    correctAnswerIndex: 2,
    category: 'Road users',
    difficulty: 'easy'
  },
  {
    id: 'q4',
    text: 'A solid yellow line on the road indicates:',
    options: ['No overtaking', 'Parking allowed', 'Cycle lane', 'Emergency lane'],
    correctAnswerIndex: 0,
    category: 'Road markings',
    difficulty: 'medium'
  },
  {
    id: 'q5',
    text: 'If your vehicle starts to skid, what should you do?',
    options: ['Brake hard', 'Steer sharply into the skid', 'Ease off the accelerator and steer smoothly', 'Turn off the engine'],
    correctAnswerIndex: 2,
    category: 'Vehicle control',
    difficulty: 'medium'
  },
  {
    id: 'q6',
    text: 'What is the meaning of a triangular road sign?',
    options: ['Parking area', 'Give way', 'Speed limit', 'No overtaking'],
    correctAnswerIndex: 1,
    category: 'Traffic signs',
    difficulty: 'easy'
  },
  {
    id: 'q7',
    text: 'Before changing lanes, the safest action is to:',
    options: ['Check mirrors and blind spots, then signal', 'Signal only', 'Move immediately', 'Brake first'],
    correctAnswerIndex: 0,
    category: 'Driving behaviour',
    difficulty: 'easy'
  },
  {
    id: 'q8',
    text: 'When driving behind a large truck, you should:',
    options: ['Stay very close for better visibility', 'Keep a safe following distance', 'Overtake immediately', 'Drive on the shoulder'],
    correctAnswerIndex: 1,
    category: 'Road safety',
    difficulty: 'medium'
  },
  {
    id: 'q9',
    text: 'Which action is most important after a collision?',
    options: ['Leave the scene quickly', 'Check for injuries and call emergency services if needed', 'Drive away to avoid traffic', 'Continue to your destination'],
    correctAnswerIndex: 1,
    category: 'Emergency response',
    difficulty: 'medium'
  },
  {
    id: 'q10',
    text: 'What should you do when an emergency vehicle is approaching with sirens?',
    options: ['Speed up to make room', 'Stop in the middle of the road', 'Pull over safely and allow it to pass', 'Ignore it if you are in a hurry'],
    correctAnswerIndex: 2,
    category: 'Emergency driving',
    difficulty: 'easy'
  }
];

export const inMemoryUsers = [];
export const inMemoryResults = [];

export function sanitizeUser(user) {
  const { password, ...safeUser } = user;
  return safeUser;
}

export function buildQuestionPayload() {
  return examQuestions.map(({ correctAnswerIndex, ...question }) => question);
}
