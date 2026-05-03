import type { MiniCard, MiniTask, MiniPressureCard, DoomScrollContent } from '../game/types';

export const MINI_CARDS: Record<string, MiniCard> = {
  'tiny-first-step': {
    id: 'tiny-first-step', name: 'Tiny First Step', cost: 0,
    rulesText: 'Add 1 progress. Draw 1.',
    effects: [{ kind: 'progressTask', amount: 1 }, { kind: 'draw', amount: 1 }],
  },
  'stim-break': {
    id: 'stim-break', name: 'Stim Break', cost: 0,
    rulesText: 'Overwhelm −1. Gain 1 energy.',
    effects: [{ kind: 'reduceOverwhelm', amount: 1 }, { kind: 'gainEnergy', amount: 1 }],
  },
  'snack-and-water': {
    id: 'snack-and-water', name: 'Snack & Water', cost: 0,
    rulesText: 'Gain 1 energy. Overwhelm −1.',
    effects: [{ kind: 'gainEnergy', amount: 1 }, { kind: 'reduceOverwhelm', amount: 1 }],
  },
  'micro-reward': {
    id: 'micro-reward', name: 'Micro Reward', cost: 0,
    rulesText: 'Gain 1 energy. Draw 1.',
    effects: [{ kind: 'gainEnergy', amount: 1 }, { kind: 'draw', amount: 1 }],
  },
  'clear-written-instructions': {
    id: 'clear-written-instructions', name: 'Clear Instructions', cost: 1,
    rulesText: 'Add 3 progress. Draw 1.',
    effects: [{ kind: 'progressTask', amount: 3 }, { kind: 'draw', amount: 1 }],
  },
  'timer-sprint': {
    id: 'timer-sprint', name: 'Timer Sprint', cost: 1,
    rulesText: 'Add 4 progress.',
    effects: [{ kind: 'progressTask', amount: 4 }],
  },
  'noise-cancelling-headphones': {
    id: 'noise-cancelling-headphones', name: 'Headphones', cost: 1,
    rulesText: 'Overwhelm −2.',
    effects: [{ kind: 'reduceOverwhelm', amount: 2 }],
  },
  'calendar-block': {
    id: 'calendar-block', name: 'Calendar Block', cost: 1,
    rulesText: 'All deadlines +1.',
    effects: [{ kind: 'extendDeadlines', amount: 1 }],
  },
  'visual-checklist': {
    id: 'visual-checklist', name: 'Visual Checklist', cost: 1,
    rulesText: 'Add 1 progress to every task. Draw 1.',
    effects: [{ kind: 'progressAll', amount: 1 }, { kind: 'draw', amount: 1 }],
  },
  'gentle-reset': {
    id: 'gentle-reset', name: 'Gentle Reset', cost: 2,
    rulesText: 'Overwhelm −5.',
    effects: [{ kind: 'reduceOverwhelm', amount: 5 }],
  },
  'parallel-play': {
    id: 'parallel-play', name: 'Parallel Play', cost: 2,
    rulesText: 'Add 2 progress to every task.',
    effects: [{ kind: 'progressAll', amount: 2 }],
  },
  'hyperfocus-tunnel': {
    id: 'hyperfocus-tunnel', name: 'Hyperfocus Tunnel', cost: 2,
    rulesText: 'Add 6 progress.',
    effects: [{ kind: 'progressTask', amount: 6 }],
  },
};

export const MINI_TASKS_DATA: Record<string, Omit<MiniTask, 'progress' | 'expired'>> = {
  'start-work-block': {
    id: 'start-work-block', name: 'Start Work Block', effort: 8, deadline: 4,
    flavor: 'Starting is a task wearing a fake moustache.',
  },
  'reply-to-email': {
    id: 'reply-to-email', name: 'Reply to Email', effort: 6, deadline: 3,
    flavor: '"Thoughts?" It contains no actual question.',
  },
  'ambiguous-request': {
    id: 'ambiguous-request', name: 'Ambiguous Request', effort: 5, deadline: 2,
    flavor: 'Urgent, unclear, and somehow already late.',
  },
};

export const MINI_PRESSURE_DATA: Record<string, MiniPressureCard> = {
  'notification-storm': {
    id: 'notification-storm', name: 'Notification Storm',
    rulesText: '+2 Overwhelm.',
    effects: [{ kind: 'addOverwhelm', amount: 2 }],
  },
  'unclear-priority': {
    id: 'unclear-priority', name: 'Unclear Priority',
    rulesText: 'All tasks: +1 effort.',
    effects: [{ kind: 'increaseEffort', amount: 1 }],
  },
  'task-switching': {
    id: 'task-switching', name: 'Task Switching',
    rulesText: 'All deadlines −1.',
    effects: [{ kind: 'shortenDeadlines', amount: 1 }],
  },
  'sleep-debt': {
    id: 'sleep-debt', name: 'Sleep Debt',
    rulesText: '+2 Overwhelm. Discard 1.',
    effects: [{ kind: 'addOverwhelm', amount: 2 }, { kind: 'discardRandom', amount: 1 }],
  },
  'context-collapse': {
    id: 'context-collapse', name: 'Context Collapse',
    rulesText: 'Discard 2 cards.',
    effects: [{ kind: 'discardRandom', amount: 2 }],
  },
  'shame-spiral': {
    id: 'shame-spiral', name: 'Shame Spiral',
    rulesText: '+3 Overwhelm.',
    effects: [{ kind: 'addOverwhelm', amount: 3 }],
  },
};

export const PRIORITY_QUEUE_DECK: string[] = [
  'tiny-first-step', 'tiny-first-step',
  'stim-break', 'stim-break',
  'snack-and-water',
  'clear-written-instructions', 'clear-written-instructions',
  'timer-sprint',
  'noise-cancelling-headphones',
  'gentle-reset',
  'micro-reward',
  'parallel-play',
];

export const PRIORITY_QUEUE_TASK_IDS: string[] = [
  'start-work-block', 'reply-to-email', 'ambiguous-request',
];

export const PRIORITY_QUEUE_PRESSURE: string[] = [
  'notification-storm', 'notification-storm',
  'unclear-priority',
  'task-switching',
  'sleep-debt',
  'context-collapse',
  'shame-spiral',
];

export const DOOM_SCROLL_CONTENTS: DoomScrollContent[] = [
  { text: 'A person you went to school with has got a promotion. They are photographed next to a building. They appear to be enjoying the building.', category: 'social' },
  { text: 'BREAKING: Something has happened. Details are emerging. Further details will also emerge, at speed, after you have already formed an opinion.', category: 'news' },
  { text: 'An account you followed in 2021 has posted a hot take. The take is technically hot. The temperature is the only interesting thing about it.', category: 'social' },
  { text: 'There is an ad for something you mentioned out loud yesterday. The ad is fine with this. You are not sure you are fine with this.', category: 'ad' },
  { text: 'A quiz: which era of a specific decade are you? You are the second option. You have no idea what this means. You share it anyway.', category: 'rabbit-hole' },
  { text: 'Someone is wrong about something on the internet. This is not news. This is the internet. You consider correcting them. You know you should not. You open the reply box.', category: 'drama' },
  { text: '"Thoughts?" The message says "Thoughts?" and links to an article you will read the headline of and feel you have read.', category: 'social' },
  { text: 'A video. 47 seconds. The first six are a black screen with music. You wait. You have waited through 46 of these this week. Statistically, this one will also not be worth it.', category: 'rabbit-hole' },
  { text: 'Your horoscope says today is a day. The stars have a plan. The plan involves a decision. You should trust your instincts. Your instincts are currently scrolling.', category: 'rabbit-hole' },
  { text: "A dog has learned to open a door. This is the best thing that has happened today. You watch it three times. The dog's name is Trevor.", category: 'social' },
  { text: 'The algorithm has noticed you. It is sending you content it believes you will engage with. It is correct. You are engaging. You are fully engaging.', category: 'ad' },
  { text: 'A thread begins: "I need to talk about something." It has forty-seven parts. You have now read thirty-one of them. You do not remember part one.', category: 'drama' },
  { text: 'A person has done something. Many people have opinions about this. The opinions are organised into categories. You are in at least two categories.', category: 'news' },
  { text: 'The recommended section has updated. It knows what you want better than you know what you want. This is either helpful or profoundly sad. Probably both.', category: 'ad' },
  { text: 'LIVE UPDATE: The thing that was happening is still happening. There has been a development. Further developments will follow. Stay tuned.', category: 'news' },
  { text: 'An old post has resurfaced. Context has shifted. People are arguing about the context. You are not sure what the original point was.', category: 'drama' },
  { text: '"This is the most important thing I have ever seen." It is a photo of a sandwich. The sandwich is, admittedly, impressive.', category: 'social' },
  { text: 'A playlist has been suggested. The playlist is called "focus music." You add it to your library. You will never listen to it.', category: 'ad' },
  { text: 'A mutual you do not really know has posted a meaningful quote. The attribution may be wrong. This information is in the comments. You read the comments.', category: 'social' },
  { text: 'You have now been on this app for a while. The app has no way of communicating this to you, and would not, as it finds your continued presence productive.', category: 'rabbit-hole' },
];

export const MEETING_BUZZWORDS: string[] = [
  "Let's circle back on the core deliverables.",
  "Can we get a quick level-set before we proceed?",
  "I want to make sure we're all moving the needle here.",
  "We need to align on bandwidth across teams.",
  "Can we action this by EOD? Or at least by COB?",
  "Let's synergise the feedback loop and take this offline.",
  "The stakeholders need more granularity on the timelines.",
  "I'm not sure we're thinking about this holistically.",
  "Is everyone bought in? I want to make sure everyone's bought in.",
  "Let's surface the key pain points before we deep-dive.",
  "We should leverage existing infrastructure going forward.",
  "I want to flag a blocker. It's not exactly a blocker.",
];

export const CONTEXT_WORD_SETS: Array<{ words: string[]; distractors: string[] }> = [
  {
    words: ['quarterly', 'report', 'pending', 'review'],
    distractors: ['budget', 'meeting', 'complete', 'upload'],
  },
  {
    words: ['browser', 'forty', 'tabs', 'open'],
    distractors: ['email', 'flag', 'reply', 'send'],
  },
  {
    words: ['timesheet', 'wednesday', 'estimate', 'vibes'],
    distractors: ['calendar', 'deadline', 'urgent', 'submit'],
  },
  {
    words: ['presentation', 'slide', 'deck', 'colours'],
    distractors: ['meeting', 'notes', 'agenda', 'action'],
  },
];
