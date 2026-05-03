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
  | { type: 'EXAMINE'; description: string; chaosDelta?: number };

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

export interface AppState {
  screen: GameScreen;
  player: PlayerState;
  log: LogEntry[];
  pendingDistraction: { steps: DistractionStep[]; stepIndex: number; completesAction?: string } | null;
  awaitingConfirm: { choiceId: string } | null;
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
  | { type: 'CLEAR_LOG' };
