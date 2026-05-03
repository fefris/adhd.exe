import type { ItemId } from './types';

export const ITEM_NAMES: Record<ItemId, string> = {
  meds: 'medication',
  keys: 'keys',
  phone: 'phone',
  'travel-card': 'travel card',
  coffee: 'coffee',
  laptop: 'laptop',
  notebook: 'notebook',
  'report-draft': 'report draft',
  headphones: 'headphones',
};

export const ITEM_DESCRIPTIONS: Record<ItemId, string> = {
  meds: 'A small orange pill bottle. You are supposed to take these every morning. You know this.',
  keys: 'Your house keys. Also your bike lock key. Also that mystery key you have had for four years.',
  phone: 'Your phone. It has 23 notifications. You will not look at them right now. Probably.',
  'travel-card': 'Your travel card. Without it, the commute becomes a negotiation.',
  coffee: 'A cup of coffee. Still hot. A rare achievement.',
  laptop: 'Your work laptop. It needs a software update. It always needs a software update.',
  notebook: 'A notebook full of half-finished to-do lists from previous days.',
  'report-draft': 'A draft of the report. Mostly placeholders and one surprisingly good paragraph.',
  headphones: 'Your noise-cancelling headphones. The only thing standing between you and the open-plan office.',
};
