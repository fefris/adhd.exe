export type RoomId =
  | 'bedroom'
  | 'bathroom-home'
  | 'home-office'
  | 'hallway'
  | 'kitchen'
  | 'backyard'
  | 'commute'
  | 'office-lobby'
  | 'break-room'
  | 'open-plan'
  | 'colleague-desk'
  | 'meeting-room'
  | 'bathroom-work'
  | 'your-desk'
  | 'supply-closet'
  | 'commute-home';

export type ItemId =
  | 'meds'
  | 'keys'
  | 'phone'
  | 'travel-card'
  | 'coffee'
  | 'laptop'
  | 'notebook'
  | 'report-draft'
  | 'headphones';

export type EndingId =
  | 'somehow-functional'
  | 'productive-chaos'
  | 'hyperfocus-void'
  | 'survived-barely'
  | 'chaos-consumed-you'
  | 'secret-no-meds'
  | 'secret-supply-closet'
  | 'secret-never-left-house';

export type GameScreen = 'title' | 'game' | 'end';

export interface PlayerState {
  focus: number;
  time: number;
  chaos: number;
  inventory: ItemId[];
  currentRoom: RoomId;
  visitedRooms: RoomId[];
  completedActions: string[];
  turn: number;
}

export interface Choice {
  id: string;
  label: string;
  action: Action;
  requiresItem?: ItemId;
  requiresAction?: string;
  blockedByAction?: string;
  chaosBonus?: number;
}

export type Action =
  | { type: 'MOVE'; to: RoomId }
  | { type: 'TAKE'; item: ItemId; description: string }
  | { type: 'USE'; item: ItemId; description: string; focusDelta?: number; timeDelta?: number; chaosDelta?: number; completesAction?: string }
  | { type: 'DISTRACTION'; description: string; steps: DistractionStep[]; completesAction?: string }
  | { type: 'TASK'; description: string; focusDelta: number; timeDelta: number; chaosDelta?: number; completesAction: string }
  | { type: 'EXAMINE'; description: string; chaosDelta?: number }
  | { type: 'MINI_GAME'; gameId: 'priority-queue' | 'doom-scroll'; description: string; completesAction?: string };

export interface DistractionStep {
  text: string;
  focusDelta: number;
  timeDelta: number;
  chaosDelta: number;
}

export interface Room {
  id: RoomId;
  name: string;
  description: (state: PlayerState) => string;
  exits: Partial<Record<'north' | 'south' | 'east' | 'west' | 'up' | 'down', RoomId>>;
  choices: (state: PlayerState) => Choice[];
  lockedMessage?: (state: PlayerState) => string | null;
}

export interface Ending {
  id: EndingId;
  title: string;
  body: string;
  condition: (state: PlayerState) => boolean;
  priority: number;
}

// ─── Mini-game types ──────────────────────────────────────────────────────────

export type MiniCardEffect =
  | { kind: 'progressTask'; amount: number }
  | { kind: 'progressAll'; amount: number }
  | { kind: 'reduceOverwhelm'; amount: number }
  | { kind: 'draw'; amount: number }
  | { kind: 'gainEnergy'; amount: number }
  | { kind: 'extendDeadlines'; amount: number }
  | { kind: 'lowerEffort'; amount: number };

export interface MiniCard {
  id: string;
  name: string;
  cost: number;
  rulesText: string;
  effects: MiniCardEffect[];
}

export type MiniPressureEffect =
  | { kind: 'addOverwhelm'; amount: number }
  | { kind: 'shortenDeadlines'; amount: number }
  | { kind: 'increaseEffort'; amount: number }
  | { kind: 'discardRandom'; amount: number };

export interface MiniPressureCard {
  id: string;
  name: string;
  rulesText: string;
  effects: MiniPressureEffect[];
}

export interface MiniTask {
  id: string;
  name: string;
  effort: number;
  deadline: number;
  progress: number;
  flavor: string;
  expired: boolean;
}

export interface PriorityQueueState {
  id: 'priority-queue';
  turn: number;
  maxTurns: number;
  energy: number;
  maxEnergy: number;
  overwhelm: number;
  maxOverwhelm: number;
  hand: string[];
  drawPile: string[];
  discardPile: string[];
  activeTasks: MiniTask[];
  totalTasks: number;
  pressureQueue: string[];
  pressureDiscard: string[];
  log: string[];
  result: 'playing' | 'won' | 'partial' | 'lost';
  selectedCard: string | null;
  completesAction?: string;
}

export interface DoomScrollContent {
  text: string;
  category: 'social' | 'news' | 'ad' | 'drama' | 'rabbit-hole';
}

export interface DoomScrollState {
  id: 'doom-scroll';
  scrollCount: number;
  timeCost: number;
  chaosCost: number;
  buttonScale: number;
  contentIndex: number;
  done: boolean;
  completesAction?: string;
}

export type PendingMiniGame = PriorityQueueState | DoomScrollState;

export interface AppState {
  screen: GameScreen;
  player: PlayerState;
  log: LogEntry[];
  pendingDistraction: { steps: DistractionStep[]; stepIndex: number; completesAction?: string } | null;
  awaitingConfirm: { choiceId: string } | null;
  pendingMiniGame: PendingMiniGame | null;
}

export interface LogEntry {
  id: string;
  text: string;
  type: 'room' | 'action' | 'thought' | 'system' | 'error';
  roomId?: RoomId;
}

export type AppAction =
  | { type: 'START_GAME' }
  | { type: 'MAKE_CHOICE'; choice: Choice }
  | { type: 'ADVANCE_DISTRACTION' }
  | { type: 'RESIST_DISTRACTION' }
  | { type: 'CLEAR_LOG' }
  | { type: 'PQ_SELECT_CARD'; cardId: string | null }
  | { type: 'PQ_PLAY_CARD'; targetTaskId: string }
  | { type: 'PQ_END_TURN' }
  | { type: 'PQ_ABANDON' }
  | { type: 'DS_SCROLL' }
  | { type: 'DS_PUT_DOWN' }
  | { type: 'COMPLETE_MINI_GAME' };
