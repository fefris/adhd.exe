import type { AppState, AppAction, PlayerState, LogEntry, Choice } from './types';
import { ROOMS } from './rooms';
import { ENDINGS } from './endings';
import { ITEM_NAMES } from './items';
import {
  createPriorityQueueState, createDoomScrollState, createTheMeetingState,
  createTimeBlindnessState, createContextSwitchState,
  pqSelectCard, pqPlayCard, pqEndTurn, pqAbandon,
  dsScroll, dsPutDown,
  tmEngage, tmZoneOut,
  tbGuess,
  csMemorizeDone, csSelectWord,
  createPixelPerfectState, ppSelectElement, ppNudge, ppFinish,
  createFishTankState, ftSelectFish, ftKeepWatching, ftNameFish, ftResearchFish, ftWalkAway,
  resolveMiniGame,
} from '../minigames/miniGameEngine';
import { MINI_CARDS } from '../minigames/miniGameContent';

export const INITIAL_PLAYER: PlayerState = {
  focus: 80,
  time: 100,
  chaos: 10,
  inventory: [],
  currentRoom: 'bedroom',
  visitedRooms: ['bedroom'],
  completedActions: [],
  turn: 0,
};

export const INITIAL_STATE: AppState = {
  screen: 'title',
  player: INITIAL_PLAYER,
  log: [],
  pendingDistraction: null,
  awaitingConfirm: null,
  pendingMiniGame: null,
};

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

function uid() {
  return Math.random().toString(36).slice(2);
}

function entry(text: string, type: LogEntry['type'] = 'action'): LogEntry {
  return { id: uid(), text, type };
}

function roomEntry(player: PlayerState): LogEntry {
  const room = ROOMS[player.currentRoom];
  const desc = room.description(player);
  return { ...entry(`\n> ${room.name}\n\n${desc}`, 'room'), roomId: player.currentRoom };
}

function applyDeltas(player: PlayerState, focus = 0, time = 0, chaos = 0): PlayerState {
  return {
    ...player,
    focus: clamp(player.focus + focus, 0, 100),
    time: clamp(player.time + time, 0, 100),
    chaos: clamp(player.chaos + chaos, 0, 100),
    turn: player.turn + 1,
  };
}

export function determineEnding(player: PlayerState) {
  const sorted = [...ENDINGS].sort((a, b) => b.priority - a.priority);
  return sorted.find(e => e.condition(player)) ?? ENDINGS[ENDINGS.length - 1];
}

export function getAvailableChoices(player: PlayerState): Choice[] {
  const room = ROOMS[player.currentRoom];
  if (!room) return [];
  let choices = room.choices(player);

  if (player.chaos >= 67) {
    const distractions = choices.filter(c => c.action.type === 'DISTRACTION');
    const extras = distractions.slice(0, 2).map(c => ({
      ...c,
      id: `chaos-${c.id}`,
      label: mutateChaosLabel(c.label, player.chaos),
      chaosBonus: 5,
    }));
    choices = [...choices, ...extras];
  }

  return choices.filter(c => {
    if (c.requiresItem && !player.inventory.includes(c.requiresItem)) return false;
    if (c.requiresAction && !player.completedActions.includes(c.requiresAction)) return false;
    if (c.blockedByAction && player.completedActions.includes(c.blockedByAction)) return false;
    return true;
  });
}

function mutateChaosLabel(label: string, chaos: number): string {
  if (chaos >= 90) return label.split('').reverse().join('') + '???';
  const inserts = ['(just quickly)', '(it\'ll only take a sec)', '(you deserve this)', '(it\'s important actually)'];
  return label + ' ' + inserts[Math.floor(chaos / 10) % inserts.length];
}

export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'START_GAME': {
      const player = { ...INITIAL_PLAYER };
      const log = [roomEntry(player)];
      return { ...INITIAL_STATE, screen: 'game', player, log };
    }

    case 'ADVANCE_DISTRACTION': {
      if (!state.pendingDistraction) return state;
      const { steps, stepIndex, completesAction } = state.pendingDistraction;
      const step = steps[stepIndex];

      if (!step) {
        let player = { ...state.player };
        const log = [...state.log, entry('You resurface. Time has passed. You are approximately where you left yourself.', 'thought')];
        if (completesAction && !player.completedActions.includes(completesAction)) {
          player = { ...player, completedActions: [...player.completedActions, completesAction] };
        }
        return { ...state, player, log, pendingDistraction: null };
      }

      const player = applyDeltas(state.player, step.focusDelta, step.timeDelta, step.chaosDelta);
      const log = [...state.log, entry(step.text, 'thought')];

      if (player.time <= 0) {
        return { ...state, player, log, screen: 'end', pendingDistraction: null };
      }

      return { ...state, player, log, pendingDistraction: { steps, stepIndex: stepIndex + 1, completesAction } };
    }

    case 'RESIST_DISTRACTION': {
      if (!state.pendingDistraction) return state;
      const player = applyDeltas(state.player, 5, 0, -5);
      const log = [...state.log, entry('You pull back. A small, genuine win. The distraction recedes.', 'thought')];
      return { ...state, player, log, pendingDistraction: null };
    }

    case 'MAKE_CHOICE': {
      const { choice } = action;
      const act = choice.action;
      let player = { ...state.player, turn: state.player.turn + 1 };
      const log = [...state.log];

      if (choice.chaosBonus) {
        player = applyDeltas(player, 0, 0, choice.chaosBonus);
      }

      switch (act.type) {
        case 'MOVE': {
          if (act.to === 'commute-home') {
            return { ...state, player, log, screen: 'end' };
          }
          const nextRoom = ROOMS[act.to];
          if (!nextRoom) return state;
          if (act.description) {
            player = applyDeltas(player, act.focusDelta ?? 0, act.timeDelta ?? 0, act.chaosDelta ?? 0);
            if (act.completesAction && !player.completedActions.includes(act.completesAction)) {
              player = { ...player, completedActions: [...player.completedActions, act.completesAction] };
            }
            log.push(entry(act.description, 'action'));
            if (player.time <= 0 || player.focus <= 0) {
              return { ...state, player, log, screen: 'end' };
            }
          }
          player = {
            ...player,
            currentRoom: act.to,
            visitedRooms: player.visitedRooms.includes(act.to)
              ? player.visitedRooms
              : [...player.visitedRooms, act.to],
          };
          log.push(roomEntry(player));
          break;
        }

        case 'TAKE': {
          if (!player.inventory.includes(act.item)) {
            player = { ...player, inventory: [...player.inventory, act.item] };
          }
          log.push(entry(`Taken: ${ITEM_NAMES[act.item]}.\n\n${act.description}`, 'action'));
          break;
        }

        case 'USE': {
          const idx = player.inventory.indexOf(act.item);
          if (idx !== -1) {
            const inv = [...player.inventory];
            inv.splice(idx, 1);
            player = { ...player, inventory: inv };
          }
          player = applyDeltas(player, act.focusDelta ?? 0, act.timeDelta ?? 0, act.chaosDelta ?? 0);
          if (act.completesAction) {
            player = { ...player, completedActions: [...player.completedActions, act.completesAction] };
          }
          log.push(entry(act.description, 'action'));
          break;
        }

        case 'TASK': {
          player = applyDeltas(player, act.focusDelta, act.timeDelta, act.chaosDelta ?? 0);
          player = { ...player, completedActions: [...player.completedActions, act.completesAction] };
          log.push(entry(act.description, 'action'));
          if (player.time <= 0 || player.focus <= 0) {
            return { ...state, player, log, screen: 'end' };
          }
          break;
        }

        case 'DISTRACTION': {
          if (!act.steps.length) return state;
          const first = act.steps[0];
          player = applyDeltas(player, first.focusDelta, first.timeDelta, first.chaosDelta);
          log.push(entry(act.description, 'thought'));
          log.push(entry(first.text, 'thought'));
          if (player.time <= 0) {
            return { ...state, player, log, screen: 'end' };
          }
          return {
            ...state, player, log,
            pendingDistraction: { steps: act.steps, stepIndex: 1, completesAction: act.completesAction },
          };
        }

        case 'EXAMINE': {
          if (act.chaosDelta) player = applyDeltas(player, 0, 0, act.chaosDelta);
          log.push(entry(act.description, 'action'));
          break;
        }

        case 'MINI_GAME': {
          log.push(entry(act.description, 'action'));
          let miniGame;
          if (act.gameId === 'priority-queue') {
            miniGame = createPriorityQueueState(player.chaos, act.completesAction);
          } else if (act.gameId === 'doom-scroll') {
            miniGame = createDoomScrollState(act.completesAction);
          } else if (act.gameId === 'the-meeting') {
            miniGame = createTheMeetingState(act.completesAction);
          } else if (act.gameId === 'time-blindness') {
            miniGame = createTimeBlindnessState(
              act.taskLabel ?? 'task',
              act.taskFocusDelta ?? 0,
              act.taskTimeDelta ?? 0,
              act.taskChaosDelta ?? 0,
              act.completesAction,
            );
          } else if (act.gameId === 'context-switch') {
            miniGame = createContextSwitchState(act.completesAction);
          } else if (act.gameId === 'pixel-perfect') {
            miniGame = createPixelPerfectState(act.completesAction);
          } else {
            miniGame = createFishTankState(act.completesAction);
          }
          return { ...state, player, log, pendingMiniGame: miniGame };
        }
      }

      return { ...state, player, log };
    }

    case 'PQ_SELECT_CARD': {
      const mg = state.pendingMiniGame;
      if (!mg || mg.id !== 'priority-queue') return state;
      if (action.cardId) {
        const card = MINI_CARDS[action.cardId];
        if (card) {
          const needsTarget = card.effects.some(e => e.kind === 'progressTask');
          if (!needsTarget) {
            const selected = pqSelectCard(mg, action.cardId);
            return { ...state, pendingMiniGame: pqPlayCard(selected) };
          }
        }
      }
      return { ...state, pendingMiniGame: pqSelectCard(mg, action.cardId) };
    }

    case 'PQ_PLAY_CARD': {
      const mg = state.pendingMiniGame;
      if (!mg || mg.id !== 'priority-queue') return state;
      return { ...state, pendingMiniGame: pqPlayCard(mg, action.targetTaskId) };
    }

    case 'PQ_END_TURN': {
      const mg = state.pendingMiniGame;
      if (!mg || mg.id !== 'priority-queue') return state;
      return { ...state, pendingMiniGame: pqEndTurn(mg) };
    }

    case 'PQ_ABANDON': {
      const mg = state.pendingMiniGame;
      if (!mg || mg.id !== 'priority-queue') return state;
      return { ...state, pendingMiniGame: pqAbandon(mg) };
    }

    case 'DS_SCROLL': {
      const mg = state.pendingMiniGame;
      if (!mg || mg.id !== 'doom-scroll') return state;
      return { ...state, pendingMiniGame: dsScroll(mg) };
    }

    case 'DS_PUT_DOWN': {
      const mg = state.pendingMiniGame;
      if (!mg || mg.id !== 'doom-scroll') return state;
      return { ...state, pendingMiniGame: dsPutDown(mg) };
    }

    case 'COMPLETE_MINI_GAME': {
      const mg = state.pendingMiniGame;
      if (!mg) return state;
      const resolution = resolveMiniGame(mg);
      let player = applyDeltas(state.player, resolution.focusDelta, resolution.timeDelta, resolution.chaosDelta);
      if (resolution.completesAction && !player.completedActions.includes(resolution.completesAction)) {
        player = { ...player, completedActions: [...player.completedActions, resolution.completesAction] };
      }
      const log = [...state.log, entry(resolution.message, 'action')];
      if (player.time <= 0 || player.focus <= 0) {
        return { ...state, player, log, pendingMiniGame: null, screen: 'end' };
      }
      return { ...state, player, log: [...log, roomEntry(player)], pendingMiniGame: null };
    }

    case 'TM_ENGAGE': {
      const mg = state.pendingMiniGame;
      if (!mg || mg.id !== 'the-meeting') return state;
      return { ...state, pendingMiniGame: tmEngage(mg) };
    }

    case 'TM_ZONE_OUT': {
      const mg = state.pendingMiniGame;
      if (!mg || mg.id !== 'the-meeting') return state;
      return { ...state, pendingMiniGame: tmZoneOut(mg) };
    }

    case 'TB_GUESS': {
      const mg = state.pendingMiniGame;
      if (!mg || mg.id !== 'time-blindness') return state;
      return { ...state, pendingMiniGame: tbGuess(mg, action.minutes) };
    }

    case 'CS_MEMORIZE_DONE': {
      const mg = state.pendingMiniGame;
      if (!mg || mg.id !== 'context-switch') return state;
      return { ...state, pendingMiniGame: csMemorizeDone(mg) };
    }

    case 'CS_SELECT_WORD': {
      const mg = state.pendingMiniGame;
      if (!mg || mg.id !== 'context-switch') return state;
      return { ...state, pendingMiniGame: csSelectWord(mg, action.word) };
    }

    case 'PP_SELECT_ELEMENT': {
      const mg = state.pendingMiniGame;
      if (!mg || mg.id !== 'pixel-perfect') return state;
      return { ...state, pendingMiniGame: ppSelectElement(mg, action.elementId) };
    }

    case 'PP_NUDGE': {
      const mg = state.pendingMiniGame;
      if (!mg || mg.id !== 'pixel-perfect') return state;
      return { ...state, pendingMiniGame: ppNudge(mg, action.dx, action.dy) };
    }

    case 'PP_FINISH': {
      const mg = state.pendingMiniGame;
      if (!mg || mg.id !== 'pixel-perfect') return state;
      return { ...state, pendingMiniGame: ppFinish(mg) };
    }

    case 'FT_SELECT_FISH': {
      const mg = state.pendingMiniGame;
      if (!mg || mg.id !== 'fish-tank') return state;
      return { ...state, pendingMiniGame: ftSelectFish(mg, action.fishId) };
    }

    case 'FT_KEEP_WATCHING': {
      const mg = state.pendingMiniGame;
      if (!mg || mg.id !== 'fish-tank') return state;
      return { ...state, pendingMiniGame: ftKeepWatching(mg) };
    }

    case 'FT_NAME_FISH': {
      const mg = state.pendingMiniGame;
      if (!mg || mg.id !== 'fish-tank') return state;
      return { ...state, pendingMiniGame: ftNameFish(mg) };
    }

    case 'FT_RESEARCH_FISH': {
      const mg = state.pendingMiniGame;
      if (!mg || mg.id !== 'fish-tank') return state;
      return { ...state, pendingMiniGame: ftResearchFish(mg) };
    }

    case 'FT_WALK_AWAY': {
      const mg = state.pendingMiniGame;
      if (!mg || mg.id !== 'fish-tank') return state;
      return { ...state, pendingMiniGame: ftWalkAway(mg) };
    }

    case 'CLEAR_LOG':
      return { ...state, log: state.log.slice(-5) };

    default:
      return state;
  }
}
