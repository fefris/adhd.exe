import { shuffle } from '../utils';
import type { PriorityQueueState, DoomScrollState, TheMeetingState, TimeBlindnessState, ContextSwitchState, PixelPerfectState, FishTankState, MiniTask, PendingMiniGame } from '../game/types';
import {
  MINI_CARDS, MINI_TASKS_DATA, MINI_PRESSURE_DATA,
  PRIORITY_QUEUE_DECK, PRIORITY_QUEUE_TASK_IDS, PRIORITY_QUEUE_PRESSURE,
  DOOM_SCROLL_CONTENTS, MEETING_BUZZWORDS, CONTEXT_WORD_SETS,
} from './miniGameContent';

export interface MiniGameResolution {
  focusDelta: number;
  timeDelta: number;
  chaosDelta: number;
  message: string;
  completesAction?: string;
}

// ─── Priority Queue ───────────────────────────────────────────────────────────

export function createPriorityQueueState(chaos: number, completesAction?: string): PriorityQueueState {
  const deck = shuffle([...PRIORITY_QUEUE_DECK]);
  const hand = deck.slice(0, 4);
  const drawPile = deck.slice(4);
  const pressureQueue = shuffle([...PRIORITY_QUEUE_PRESSURE]);
  const activeTasks: MiniTask[] = PRIORITY_QUEUE_TASK_IDS.map(id => ({
    ...MINI_TASKS_DATA[id],
    progress: 0,
    expired: false,
  }));
  const startOverwhelm = chaos >= 67 ? 4 : chaos >= 34 ? 2 : 0;

  return {
    id: 'priority-queue',
    turn: 1,
    maxTurns: 3,
    energy: 3,
    maxEnergy: 3,
    overwhelm: startOverwhelm,
    maxOverwhelm: 10,
    hand,
    drawPile,
    discardPile: [],
    activeTasks,
    totalTasks: activeTasks.length,
    pressureQueue,
    pressureDiscard: [],
    log: ['You sit down at the desk. The tasks are not going anywhere. Neither are you.', '── Turn 1 ──'],
    result: 'playing',
    selectedCard: null,
    completesAction,
  };
}

export function pqSelectCard(state: PriorityQueueState, cardId: string | null): PriorityQueueState {
  return { ...state, selectedCard: cardId };
}

export function pqPlayCard(state: PriorityQueueState, targetTaskId?: string): PriorityQueueState {
  const cardId = state.selectedCard;
  if (!cardId) return state;

  const card = MINI_CARDS[cardId];
  if (!card) return { ...state, selectedCard: null };

  if (card.cost > state.energy) {
    return { ...state, log: [...state.log, `Not enough energy for ${card.name}.`] };
  }

  const needsTarget = card.effects.some(e => e.kind === 'progressTask');
  if (needsTarget && !targetTaskId) return state;

  let s = { ...state, energy: state.energy - card.cost, selectedCard: null };
  const lines: string[] = [];

  for (const eff of card.effects) {
    switch (eff.kind) {
      case 'progressTask': {
        const task = s.activeTasks.find(t => t.id === targetTaskId && !t.expired && t.progress < t.effort);
        if (task) {
          const added = Math.min(eff.amount, task.effort - task.progress);
          s = {
            ...s,
            activeTasks: s.activeTasks.map(t =>
              t.id === targetTaskId ? { ...t, progress: t.progress + added } : t
            ),
          };
          const updated = s.activeTasks.find(t => t.id === targetTaskId)!;
          lines.push(`${card.name} → +${added} to ${task.name}${updated.progress >= updated.effort ? ' ✓' : ''}.`);
        }
        break;
      }
      case 'progressAll': {
        s = {
          ...s,
          activeTasks: s.activeTasks.map(t =>
            t.expired ? t : { ...t, progress: Math.min(t.effort, t.progress + eff.amount) }
          ),
        };
        lines.push(`${card.name} → +${eff.amount} progress to all tasks.`);
        break;
      }
      case 'reduceOverwhelm': {
        const before = s.overwhelm;
        s = { ...s, overwhelm: Math.max(0, s.overwhelm - eff.amount) };
        lines.push(`${card.name} → Overwhelm −${before - s.overwhelm}.`);
        break;
      }
      case 'draw': {
        let { drawPile, discardPile } = s;
        if (drawPile.length < eff.amount) {
          drawPile = [...drawPile, ...shuffle([...discardPile])];
          discardPile = [];
        }
        const drawn = drawPile.slice(0, eff.amount);
        s = { ...s, hand: [...s.hand, ...drawn], drawPile: drawPile.slice(eff.amount), discardPile };
        if (drawn.length > 0) lines.push(`${card.name} → draw ${drawn.length}.`);
        break;
      }
      case 'gainEnergy': {
        s = { ...s, energy: Math.min(s.maxEnergy, s.energy + eff.amount) };
        lines.push(`${card.name} → energy +${eff.amount}.`);
        break;
      }
      case 'extendDeadlines': {
        s = {
          ...s,
          activeTasks: s.activeTasks.map(t =>
            t.expired ? t : { ...t, deadline: t.deadline + eff.amount }
          ),
        };
        lines.push(`${card.name} → all deadlines +${eff.amount}.`);
        break;
      }
      case 'lowerEffort': {
        s = {
          ...s,
          activeTasks: s.activeTasks.map(t =>
            t.expired ? t : { ...t, effort: Math.max(1, t.effort - eff.amount) }
          ),
        };
        lines.push(`${card.name} → all effort −${eff.amount}.`);
        break;
      }
    }
  }

  // Remove first occurrence of played card from hand
  const handArr = [...s.hand];
  const idx = handArr.indexOf(cardId);
  if (idx !== -1) handArr.splice(idx, 1);

  return { ...s, hand: handArr, discardPile: [...s.discardPile, cardId], log: [...s.log, ...lines] };
}

export function pqEndTurn(state: PriorityQueueState): PriorityQueueState {
  let s = { ...state, selectedCard: null };
  const lines: string[] = [];

  // Tick deadlines
  s = {
    ...s,
    activeTasks: s.activeTasks.map(t => t.expired ? t : { ...t, deadline: t.deadline - 1 }),
  };

  // Expire overdue incomplete tasks
  const expiring = s.activeTasks.filter(t => !t.expired && t.deadline <= 0 && t.progress < t.effort);
  if (expiring.length > 0) {
    const penalty = expiring.length * 3;
    s = {
      ...s,
      overwhelm: Math.min(s.maxOverwhelm, s.overwhelm + penalty),
      activeTasks: s.activeTasks.map(t =>
        !t.expired && t.deadline <= 0 && t.progress < t.effort ? { ...t, expired: true } : t
      ),
    };
    lines.push(`${expiring.map(t => t.name).join(', ')} expired. +${penalty} Overwhelm.`);
  }

  // Flip pressure card
  if (s.pressureQueue.length > 0) {
    const [pressureId, ...remaining] = s.pressureQueue;
    const pressure = MINI_PRESSURE_DATA[pressureId];
    s = { ...s, pressureQueue: remaining, pressureDiscard: [...s.pressureDiscard, pressureId] };
    if (pressure) {
      lines.push(`▶ ${pressure.name}: ${pressure.rulesText}`);
      for (const eff of pressure.effects) {
        switch (eff.kind) {
          case 'addOverwhelm':
            s = { ...s, overwhelm: Math.min(s.maxOverwhelm, s.overwhelm + eff.amount) };
            break;
          case 'shortenDeadlines':
            s = {
              ...s,
              activeTasks: s.activeTasks.map(t =>
                t.expired ? t : { ...t, deadline: t.deadline - eff.amount }
              ),
            };
            break;
          case 'increaseEffort':
            s = {
              ...s,
              activeTasks: s.activeTasks.map(t =>
                t.expired ? t : { ...t, effort: t.effort + eff.amount }
              ),
            };
            break;
          case 'discardRandom': {
            const toDiscard = s.hand.slice(0, eff.amount);
            s = {
              ...s,
              hand: s.hand.slice(eff.amount),
              discardPile: [...s.discardPile, ...toDiscard],
            };
            if (toDiscard.length > 0) {
              lines.push(`Discarded: ${toDiscard.map(id => MINI_CARDS[id]?.name ?? id).join(', ')}.`);
            }
            break;
          }
        }
      }
    }
  }

  // Check loss: overwhelm maxed
  if (s.overwhelm >= s.maxOverwhelm) {
    lines.push('Overwhelm maxed. You push back from the desk.');
    return { ...s, log: [...s.log, ...lines], result: 'lost' };
  }

  const completedCount = s.activeTasks.filter(t => t.progress >= t.effort).length;
  const incompleteActive = s.activeTasks.filter(t => !t.expired && t.progress < t.effort).length;

  // Check win: all tasks completed
  if (completedCount === s.totalTasks) {
    lines.push('All tasks complete.');
    return { ...s, log: [...s.log, ...lines], result: 'won' };
  }

  // Check if all remaining tasks have expired with nothing done
  if (incompleteActive === 0 && completedCount === 0) {
    lines.push('Every task expired. Nothing happened.');
    return { ...s, log: [...s.log, ...lines], result: 'lost' };
  }

  // Check last turn
  if (s.turn >= s.maxTurns) {
    const result: PriorityQueueState['result'] =
      completedCount === s.totalTasks ? 'won' : completedCount > 0 ? 'partial' : 'lost';
    const endings = {
      won: 'Everything done.',
      partial: 'Time is up. Some things happened.',
      lost: 'Time is up. Nothing finished.',
    };
    lines.push(endings[result]);
    return { ...s, log: [...s.log, ...lines], result };
  }

  // Draw up to 4, reset energy, advance turn
  const drawCount = Math.max(0, 4 - s.hand.length);
  let { drawPile, discardPile } = s;
  if (drawPile.length < drawCount) {
    drawPile = [...drawPile, ...shuffle([...discardPile])];
    discardPile = [];
  }
  const drawn = drawPile.slice(0, drawCount);

  return {
    ...s,
    hand: [...s.hand, ...drawn],
    drawPile: drawPile.slice(drawCount),
    discardPile,
    energy: s.maxEnergy,
    turn: s.turn + 1,
    log: [...s.log, ...lines, `── Turn ${s.turn + 1} ──`],
  };
}

export function pqAbandon(state: PriorityQueueState): PriorityQueueState {
  return {
    ...state,
    result: 'lost',
    selectedCard: null,
    log: [...state.log, 'You push back from the desk. The tasks remain.'],
  };
}

export function pqResolve(state: PriorityQueueState): MiniGameResolution {
  switch (state.result) {
    case 'won':
      return {
        focusDelta: 15, timeDelta: -10, chaosDelta: -10,
        message: 'You cleared the board. Everything got done. This is not how most days go.',
        completesAction: state.completesAction,
      };
    case 'partial': {
      const completed = state.activeTasks.filter(t => t.progress >= t.effort).length;
      return {
        focusDelta: 5, timeDelta: -10, chaosDelta: 5,
        message: `${completed} task${completed !== 1 ? 's' : ''} done. The rest are still there. You resurface.`,
        completesAction: state.completesAction,
      };
    }
    case 'lost':
    default:
      return {
        focusDelta: -15, timeDelta: -10, chaosDelta: 20,
        message: 'You sat at the desk for a while. The tasks watched you sit there. Nothing is different.',
        completesAction: undefined,
      };
  }
}

// ─── Doom Scroll ─────────────────────────────────────────────────────────────

export function createDoomScrollState(completesAction?: string): DoomScrollState {
  return {
    id: 'doom-scroll',
    scrollCount: 0,
    timeCost: 0,
    chaosCost: 0,
    buttonScale: 1.0,
    contentIndex: Math.floor(Math.random() * DOOM_SCROLL_CONTENTS.length),
    done: false,
    completesAction,
  };
}

export function dsScroll(state: DoomScrollState): DoomScrollState {
  const newCount = state.scrollCount + 1;
  const newIndex = (state.contentIndex + 1) % DOOM_SCROLL_CONTENTS.length;
  const newScale = Math.max(0.2, 1.0 - newCount * 0.09);
  return {
    ...state,
    scrollCount: newCount,
    timeCost: state.timeCost + 3,
    chaosCost: state.chaosCost + 3,
    buttonScale: newScale,
    contentIndex: newIndex,
    done: newCount >= 10,
  };
}

export function dsPutDown(state: DoomScrollState): DoomScrollState {
  return { ...state, done: true };
}

export function dsResolve(state: DoomScrollState): MiniGameResolution {
  const { scrollCount } = state;
  const timeDelta = -Math.min(25, state.timeCost);
  const chaosDelta = Math.min(25, state.chaosCost);

  if (scrollCount === 0) {
    return {
      focusDelta: 5, timeDelta: -2, chaosDelta: 2,
      message: 'You looked at it. You put it down. Remarkable restraint.',
    };
  } else if (scrollCount <= 2) {
    return {
      focusDelta: 3, timeDelta, chaosDelta: Math.floor(chaosDelta / 2),
      message: 'You put it down. A minor miracle.',
    };
  } else if (scrollCount <= 5) {
    return {
      focusDelta: 0, timeDelta, chaosDelta,
      message: 'Eventually you resurfaced. The phone was warm.',
    };
  } else if (scrollCount <= 8) {
    return {
      focusDelta: -8, timeDelta, chaosDelta,
      message: "The phone was warm. You don't know how long that took.",
    };
  } else {
    return {
      focusDelta: -15, timeDelta: -25, chaosDelta: 25,
      message: 'Your thumb is still moving. You stop it deliberately. You have been here a while.',
    };
  }
}

// ─── The Meeting ─────────────────────────────────────────────────────────────

export function createTheMeetingState(completesAction?: string): TheMeetingState {
  return {
    id: 'the-meeting',
    round: 0,
    maxRounds: 8,
    engaged: 0,
    zonedOut: 0,
    done: false,
    completesAction,
  };
}

export function getBuzzword(round: number): string {
  return MEETING_BUZZWORDS[round % MEETING_BUZZWORDS.length];
}

function tmAdvance(state: TheMeetingState, didEngage: boolean): TheMeetingState {
  const nextRound = state.round + 1;
  return {
    ...state,
    round: nextRound,
    engaged: state.engaged + (didEngage ? 1 : 0),
    zonedOut: state.zonedOut + (didEngage ? 0 : 1),
    done: nextRound >= state.maxRounds,
  };
}

export function tmEngage(state: TheMeetingState): TheMeetingState {
  return tmAdvance(state, true);
}

export function tmZoneOut(state: TheMeetingState): TheMeetingState {
  return tmAdvance(state, false);
}

export function tmResolve(state: TheMeetingState): MiniGameResolution {
  const ratio = state.engaged / state.maxRounds;
  if (ratio >= 0.75) {
    return {
      focusDelta: -8, timeDelta: -20, chaosDelta: 8,
      message: 'You participated. You nodded at the right moments. You said "absolutely" once and meant it approximately forty percent of the time.',
      completesAction: state.completesAction,
    };
  } else if (ratio >= 0.5) {
    return {
      focusDelta: -12, timeDelta: -20, chaosDelta: 15,
      message: 'You were there. Partially. The part that was there did its best. Nobody noticed the rest.',
      completesAction: state.completesAction,
    };
  } else if (ratio >= 0.25) {
    return {
      focusDelta: -5, timeDelta: -20, chaosDelta: 22,
      message: 'The meeting happened to you. You were technically present. Nobody can prove otherwise. The follow-up email will contain information you do not remember.',
      completesAction: state.completesAction,
    };
  } else {
    return {
      focusDelta: 5, timeDelta: -20, chaosDelta: 28,
      message: 'You were somewhere else entirely. The meeting occurred without your participation. Someone will email you a summary. You will not read the summary.',
      completesAction: state.completesAction,
    };
  }
}

// ─── Time Blindness ──────────────────────────────────────────────────────────

const TB_ACTUAL_POOL = [18, 25, 35, 45, 55, 70, 90];

export function createTimeBlindnessState(
  taskLabel: string,
  focusDelta: number,
  timeDelta: number,
  chaosDelta: number,
  completesAction?: string,
): TimeBlindnessState {
  const actual = TB_ACTUAL_POOL[Math.floor(Math.random() * TB_ACTUAL_POOL.length)];
  return {
    id: 'time-blindness',
    taskLabel,
    guessedMinutes: null,
    actualMinutes: actual,
    phase: 'guessing',
    focusDelta,
    timeDelta,
    chaosDelta,
    completesAction,
  };
}

export function tbGuess(state: TimeBlindnessState, minutes: number): TimeBlindnessState {
  return { ...state, guessedMinutes: minutes, phase: 'done' };
}

export function tbResolve(state: TimeBlindnessState): MiniGameResolution {
  const guessed = state.guessedMinutes ?? 15;
  const actual = state.actualMinutes;
  const gap = Math.abs(actual - guessed);

  let extraChaos: number;
  let message: string;

  if (gap <= 10) {
    extraChaos = 0;
    message = `You thought it would take ${guessed} minutes. It took ${actual}. You were almost right. This is extremely rare for you. Note it.`;
  } else if (gap <= 25) {
    extraChaos = 5;
    message = `You thought it would take ${guessed} minutes. It took ${actual}. Off by ${gap} minutes. For you, this is a precise estimate.`;
  } else if (gap <= 50) {
    extraChaos = 12;
    message = `You thought it would take ${guessed} minutes. It took ${actual} minutes. You were off by ${gap} minutes. This is normal. This is always normal.`;
  } else {
    extraChaos = 20;
    message = `You thought it would take ${guessed} minutes. It took ${actual} minutes. You were off by ${gap} minutes. Time is doing something to you specifically.`;
  }

  return {
    focusDelta: state.focusDelta,
    timeDelta: state.timeDelta,
    chaosDelta: state.chaosDelta + extraChaos,
    message,
    completesAction: state.completesAction,
  };
}

// ─── Context Switch ──────────────────────────────────────────────────────────

export function createContextSwitchState(completesAction?: string): ContextSwitchState {
  const set = CONTEXT_WORD_SETS[Math.floor(Math.random() * CONTEXT_WORD_SETS.length)];
  const recallOptions = shuffle([...set.words, ...set.distractors]);
  return {
    id: 'context-switch',
    words: set.words,
    distractors: set.distractors,
    phase: 'memorize',
    selectedWords: [],
    recallOptions,
    completesAction,
  };
}

export function csMemorizeDone(state: ContextSwitchState): ContextSwitchState {
  return { ...state, phase: 'recall' };
}

export function csSelectWord(state: ContextSwitchState, word: string): ContextSwitchState {
  if (state.phase !== 'recall') return state;
  const idx = state.selectedWords.indexOf(word);
  let selected: string[];
  if (idx !== -1) {
    selected = state.selectedWords.filter(w => w !== word);
  } else if (state.selectedWords.length < 4) {
    selected = [...state.selectedWords, word];
  } else {
    return state;
  }
  return { ...state, selectedWords: selected, phase: selected.length === 4 ? 'done' : 'recall' };
}

export function csResolve(state: ContextSwitchState): MiniGameResolution {
  const correct = state.selectedWords.filter(w => state.words.includes(w)).length;
  if (correct === 4) {
    return {
      focusDelta: 10, timeDelta: -2, chaosDelta: -5,
      message: 'You remembered all four. Context fully restored. This does not happen often. This is the good kind of neurology day.',
      completesAction: state.completesAction,
    };
  } else if (correct === 3) {
    return {
      focusDelta: 3, timeDelta: -2, chaosDelta: 5,
      message: 'Three out of four. You recovered most of the thread. The fourth thing will come back to you at 11pm.',
      completesAction: state.completesAction,
    };
  } else if (correct === 2) {
    return {
      focusDelta: -5, timeDelta: -5, chaosDelta: 10,
      message: 'Two of the four things. Half the context. You rebuild from there, slowly, at the cost of everything else.',
      completesAction: state.completesAction,
    };
  } else {
    return {
      focusDelta: -12, timeDelta: -5, chaosDelta: 18,
      message: `You got ${correct} of the four things. The others are gone. You start from the beginning, which takes longer than if you had simply stayed.`,
      completesAction: state.completesAction,
    };
  }
}

// ─── Shared resolver ──────────────────────────────────────────────────────────

export function createPixelPerfectState(completesAction?: string): PixelPerfectState {
  return {
    id: 'pixel-perfect',
    actionsRemaining: 12,
    maxActions: 12,
    selectedElementId: 'title',
    done: false,
    completesAction,
    log: [
      'The presenter advances the slide. The title is three pixels wrong. The chart is worse.',
      'Fix what matters before the presenter moves on.',
    ],
    elements: [
      { id: 'title', name: 'Title', role: 'critical', x: 31, y: 25, targetX: 28, targetY: 24, width: 142, height: 20 },
      { id: 'chart', name: 'Chart', role: 'critical', x: 199, y: 83, targetX: 192, targetY: 80, width: 82, height: 58 },
      { id: 'bullets', name: 'Bullets', role: 'critical', x: 38, y: 82, targetX: 40, targetY: 80, width: 108, height: 64 },
      { id: 'logo', name: 'Logo', role: 'cosmetic', x: 260, y: 24, targetX: 264, targetY: 24, width: 18, height: 18 },
      { id: 'footer', name: 'Footer', role: 'cosmetic', x: 140, y: 165, targetX: 136, targetY: 164, width: 64, height: 8 },
    ],
  };
}

function ppElementDistance(element: PixelPerfectState['elements'][number]): number {
  return Math.abs(element.x - element.targetX) + Math.abs(element.y - element.targetY);
}

export function ppSelectElement(state: PixelPerfectState, elementId: string): PixelPerfectState {
  if (state.done || !state.elements.some(element => element.id === elementId)) return state;
  return { ...state, selectedElementId: elementId };
}

export function ppNudge(state: PixelPerfectState, dx: number, dy: number): PixelPerfectState {
  if (state.done || state.actionsRemaining <= 0) return state;

  const selected = state.elements.find(element => element.id === state.selectedElementId);
  if (!selected) return state;

  const step = 3;
  const wasDistance = ppElementDistance(selected);
  const elements = state.elements.map(element => {
    if (element.id !== selected.id) return element;
    return {
      ...element,
      x: Math.max(8, Math.min(292 - element.width, element.x + dx * step)),
      y: Math.max(8, Math.min(172 - element.height, element.y + dy * step)),
    };
  });
  const updated = elements.find(element => element.id === selected.id) ?? selected;
  const isDistance = ppElementDistance(updated);
  const line = isDistance < wasDistance
    ? `${selected.name}: closer. This is satisfying in a way the meeting is not.`
    : `${selected.name}: technically moved. Emotionally unresolved.`;

  return {
    ...state,
    elements,
    actionsRemaining: state.actionsRemaining - 1,
    done: state.actionsRemaining <= 1,
    log: [...state.log, line],
  };
}

export function ppFinish(state: PixelPerfectState): PixelPerfectState {
  if (state.done) return state;
  return { ...state, done: true, log: [...state.log, 'You let the slide go. Mostly.'] };
}

export function ppResolve(state: PixelPerfectState): MiniGameResolution {
  const aligned = state.elements.filter(element => ppElementDistance(element) <= 2);
  const criticalAligned = aligned.filter(element => element.role === 'critical').length;
  const cosmeticAligned = aligned.filter(element => element.role === 'cosmetic').length;
  const spent = state.maxActions - state.actionsRemaining;

  if (criticalAligned >= 3 && cosmeticAligned <= 1) {
    return {
      focusDelta: 5,
      timeDelta: -8,
      chaosDelta: -8,
      message: 'You fix the title, the chart, and the bullets. The slide becomes bearable. You do not chase the footer. This is growth.',
      completesAction: state.completesAction,
    };
  }

  if (criticalAligned >= 3) {
    return {
      focusDelta: -3,
      timeDelta: -12,
      chaosDelta: 8,
      message: 'The important parts are aligned. Then you spend the remaining attention budget on the logo and footer. Nobody else can tell. You can tell.',
      completesAction: state.completesAction,
    };
  }

  if (criticalAligned >= 2) {
    return {
      focusDelta: -5,
      timeDelta: -10,
      chaosDelta: 12,
      message: 'Some of the slide is better. Some of it is still wrong. The presenter has moved on. The wrong parts move with you.',
      completesAction: state.completesAction,
    };
  }

  return {
    focusDelta: spent >= state.maxActions ? -12 : -8,
    timeDelta: -8,
    chaosDelta: spent >= state.maxActions ? 22 : 16,
    message: 'You nudge rectangles while the presentation continues. The slide remains wrong in new and interesting ways.',
    completesAction: state.completesAction,
  };
}

export function createFishTankState(completesAction?: string): FishTankState {
  return {
    id: 'fish-tank',
    watchCount: 0,
    maxWatchCount: 6,
    fascination: 0,
    namedFish: false,
    researchedFish: false,
    selectedFishId: null,
    done: false,
    completesAction,
    log: ['The screensaver fish drift across the monitor. One of them has purpose. You are almost certain.'],
  };
}

export function ftSelectFish(state: FishTankState, fishId: string): FishTankState {
  if (state.done) return state;
  return {
    ...state,
    selectedFishId: fishId,
    fascination: state.fascination + 1,
    log: [...state.log, `You choose ${fishId}. This was not a decision you planned to make.`],
  };
}

export function ftKeepWatching(state: FishTankState): FishTankState {
  if (state.done) return state;
  const watchCount = state.watchCount + 1;
  const observations = [
    'The fish crosses behind the castle. This feels narratively significant.',
    'Two fish almost line up. You wait to see if they will do it properly.',
    'The orange fish changes direction with what looks like intention.',
    'You notice the bubble loop repeats every few seconds. You begin timing it.',
    'The fish are not real. This does not reduce their hold on you.',
    'You have become the world expert on this specific screensaver.',
  ];

  return {
    ...state,
    watchCount,
    fascination: state.fascination + 2,
    done: watchCount >= state.maxWatchCount,
    log: [...state.log, observations[Math.min(watchCount - 1, observations.length - 1)]],
  };
}

export function ftNameFish(state: FishTankState): FishTankState {
  if (state.done || state.namedFish) return state;
  return {
    ...state,
    namedFish: true,
    fascination: state.fascination + 3,
    watchCount: state.watchCount + 1,
    done: state.watchCount + 1 >= state.maxWatchCount,
    log: [...state.log, 'You name one of them Captain Spreadsheet. This makes leaving harder.'],
  };
}

export function ftResearchFish(state: FishTankState): FishTankState {
  if (state.done || state.researchedFish) return state;
  return {
    ...state,
    researchedFish: true,
    fascination: state.fascination + 4,
    watchCount: state.watchCount + 2,
    done: state.watchCount + 2 >= state.maxWatchCount,
    log: [...state.log, 'You search whether digital fish sleep. The answer is obvious and still unsatisfying.'],
  };
}

export function ftWalkAway(state: FishTankState): FishTankState {
  if (state.done) return state;
  return {
    ...state,
    done: true,
    log: [...state.log, state.watchCount <= 1 ? 'You walk away before the fish become a project.' : 'You step back from the monitor. The fish continue without you, probably.'],
  };
}

export function ftResolve(state: FishTankState): MiniGameResolution {
  if (state.watchCount <= 1 && state.fascination <= 2) {
    return {
      focusDelta: 3,
      timeDelta: -2,
      chaosDelta: -2,
      message: 'You notice the fish and then leave. A clean break. The fish remain fish-sized.',
      completesAction: state.completesAction,
    };
  }

  if (state.watchCount <= 3 && !state.researchedFish) {
    return {
      focusDelta: -3,
      timeDelta: -6,
      chaosDelta: 8,
      message: 'You watch the fish for a while. Not a disastrous while. Long enough that the monitor has become a location in your day.',
      completesAction: state.completesAction,
    };
  }

  if (state.researchedFish || state.namedFish) {
    return {
      focusDelta: -8,
      timeDelta: -12,
      chaosDelta: 18,
      message: 'The fish now have names, motives, and a search history. You return to the room with less time and more narrative responsibility.',
      completesAction: state.completesAction,
    };
  }

  return {
    focusDelta: -12,
    timeDelta: -15,
    chaosDelta: 24,
    message: 'You watch until the loop folds back on itself. The fish were never going anywhere. Somehow, neither were you.',
    completesAction: state.completesAction,
  };
}

export function resolveMiniGame(mg: PendingMiniGame): MiniGameResolution {
  if (mg.id === 'priority-queue') return pqResolve(mg);
  if (mg.id === 'doom-scroll') return dsResolve(mg);
  if (mg.id === 'the-meeting') return tmResolve(mg);
  if (mg.id === 'time-blindness') return tbResolve(mg);
  if (mg.id === 'pixel-perfect') return ppResolve(mg);
  if (mg.id === 'fish-tank') return ftResolve(mg);
  return csResolve(mg);
}
