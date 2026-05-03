import type { Room, PlayerState, Choice, RoomId } from './types';

function hasDone(state: PlayerState, action: string) {
  return state.completedActions.includes(action);
}

function hasItem(state: PlayerState, item: string) {
  return state.inventory.includes(item as never);
}

function chaosInsert(state: PlayerState, ...fragments: string[]): string {
  if (state.chaos < 34) return '';
  return ' ' + fragments[Math.floor((state.turn * 7) % fragments.length)];
}

function exitChoice(label: string, to: RoomId, direction?: string): Choice {
  return {
    id: `exit-${to}`,
    label: direction ? `Go ${direction} (${label})` : label,
    action: { type: 'MOVE', to },
  };
}

export const ROOMS: Record<string, Room> = {

  bedroom: {
    id: 'bedroom',
    name: 'BEDROOM',
    description: (s) => {
      let desc = 'You are in your bedroom. The alarm went off seventeen minutes ago. You are aware of this fact in the same way you are aware that vegetables exist.';
      if (s.chaos >= 34) desc += ' The ceiling has a water stain you have been meaning to investigate. It is shaped like either a dog or the concept of disappointment.';
      if (s.chaos >= 67) desc += ' You briefly consider whether your duvet cover has always been that colour or whether something has happened to it. You decide not to pursue this line of thinking.';
      if (!hasDone(s, 'took-meds') && hasItem(s, 'meds')) desc += ' Your medication is in your hand. This is progress.';
      return desc;
    },
    exits: { south: 'hallway', east: 'bathroom-home' },
    choices: (s) => {
      const choices: Choice[] = [];

      if (!hasDone(s, 'took-meds')) {
        if (!hasItem(s, 'meds')) {
          choices.push({
            id: 'take-meds-from-drawer',
            label: 'Get medication from bedside drawer',
            action: { type: 'TAKE', item: 'meds', description: 'You open the drawer. Inside: a charger for a phone you no longer own, two batteries of unknown charge, and your medication. You take the medication.' },
          });
        } else {
          choices.push({
            id: 'take-meds',
            label: 'Take medication',
            action: { type: 'TASK', description: 'You take your medication. Your brain does not immediately become organised. You were not expecting it to. You were a little bit expecting it to.', focusDelta: 15, timeDelta: -3, chaosDelta: -10, completesAction: 'took-meds' },
            requiresItem: 'meds',
          });
        }
      }

      if (!hasItem(s, 'phone')) {
        choices.push({
          id: 'take-phone',
          label: 'Pick up phone',
          action: { type: 'TAKE', item: 'phone', description: 'You pick up your phone. The screen lights up. You put it face-down. You pick it up again. This is already going very well.' },
        });
      }

      choices.push({
        id: 'check-phone',
        label: 'Check phone notifications',
        action: {
          type: 'DISTRACTION',
          description: 'You unlock the phone.',
          steps: [
            { text: 'You have 23 notifications. You open one email. It is from a service you signed up for in 2019. You unsubscribe. You are then on the unsubscribe confirmation page, which has a survey.', focusDelta: -5, timeDelta: -5, chaosDelta: 8 },
            { text: 'The survey has six questions. The sixth question asks how you heard about them. You did not hear about them. You found them. There is no option for this. You close the survey and open a different email.', focusDelta: -5, timeDelta: -8, chaosDelta: 10 },
            { text: 'The email is from your bank. Your direct debit has changed. You spend four minutes trying to remember what the direct debit is for. It is for a gym you have not been to since February. You make a note to cancel it. The note is the fifteenth such note.', focusDelta: -8, timeDelta: -10, chaosDelta: 12 },
          ],
        },
      });

      choices.push({
        id: 'stare-at-ceiling',
        label: 'Stare at the ceiling for a moment',
        action: {
          type: 'DISTRACTION',
          description: 'You stare at the ceiling.',
          steps: [
            { text: 'The water stain is definitely shaped like a dog. Or possibly a map of a country that no longer exists.', focusDelta: -2, timeDelta: -5, chaosDelta: 5 },
            { text: 'You try to remember when it appeared. You cannot. You consider that this may mean it has always been there, which raises questions about your observational skills that you prefer not to examine.', focusDelta: -3, timeDelta: -7, chaosDelta: 7 },
          ],
        },
      });

      choices.push(exitChoice('Bathroom', 'bathroom-home', 'east'));
      choices.push(exitChoice('Hallway', 'hallway', 'south'));

      return choices;
    },
  },

  'bathroom-home': {
    id: 'bathroom-home',
    name: 'BATHROOM',
    description: (s) => {
      let desc = 'The bathroom. Small, functional, and containing a mirror that shows you information you have not requested.';
      if (s.chaos >= 34) desc += chaosInsert(s, ' You count the tiles. There are either forty-two or forty-four. You lose count at thirty-one both times.', ' The soap dispenser is almost empty. You have thought this every day for two weeks.');
      if (hasDone(s, 'brushed-teeth')) desc += ' Your teeth are brushed. A solid foundation.';
      return desc;
    },
    exits: { west: 'bedroom' },
    choices: (s) => {
      const choices: Choice[] = [];

      if (!hasDone(s, 'brushed-teeth')) {
        choices.push({
          id: 'brush-teeth',
          label: 'Brush teeth',
          action: { type: 'TASK', description: 'You brush your teeth for the recommended two minutes, which feels like eight minutes, which is actually forty-five seconds. Dentists have a different relationship with time than the rest of us.', focusDelta: 3, timeDelta: -4, completesAction: 'brushed-teeth' },
        });
      }

      choices.push({
        id: 'mirror-spiral',
        label: 'Look in the mirror',
        action: {
          type: 'DISTRACTION',
          description: 'You look in the mirror.',
          steps: [
            { text: 'You look fine. You look at your face for longer than is socially normal, given that you are alone. You notice your left eyebrow is doing something.', focusDelta: -3, timeDelta: -4, chaosDelta: 6 },
            { text: 'You spend three minutes attempting to address the eyebrow situation. The eyebrow is not responding to negotiation. You declare a ceasefire.', focusDelta: -4, timeDelta: -6, chaosDelta: 5 },
          ],
        },
      });

      choices.push({
        id: 'shower',
        label: 'Have a shower',
        action: {
          type: 'DISTRACTION',
          description: 'You turn on the shower.',
          steps: [
            { text: 'The shower takes ninety seconds to warm up. During this time you have four separate ideas that seem important. You will remember none of them.', focusDelta: 5, timeDelta: -8, chaosDelta: -5 },
            { text: 'The shower itself is fine. You stand in it slightly longer than necessary because it is warm and the rest of the day is not.', focusDelta: 8, timeDelta: -12, chaosDelta: -8 },
          ],
        },
      });

      choices.push(exitChoice('Bedroom', 'bedroom', 'west'));
      return choices;
    },
  },

  'home-office': {
    id: 'home-office',
    name: 'HOME OFFICE',
    description: (s) => {
      let desc = 'A small room containing a desk, a chair, and approximately four hundred browser tabs\' worth of ambient guilt.';
      if (s.chaos >= 34) desc += ' There is a to-do list on the desk. It is from March. Several items on it have been completed. Several more items on it have been completed but not crossed off, which is a different kind of problem.';
      if (hasDone(s, 'found-report-draft')) desc += ' The report draft is in your bag. This counts as progress.';
      return desc;
    },
    exits: { east: 'hallway' },
    choices: (s) => {
      const choices: Choice[] = [];

      if (!hasDone(s, 'found-report-draft')) {
        choices.push({
          id: 'find-report',
          label: 'Look for the report draft',
          action: { type: 'TAKE', item: 'report-draft', description: 'It is under a book about productivity systems that you bought eighteen months ago and have not finished. The irony is not lost on you. It is, however, extremely present.' },
        });
      }

      if (!hasItem(s, 'headphones')) {
        choices.push({
          id: 'take-headphones',
          label: 'Grab headphones',
          action: { type: 'TAKE', item: 'headphones', description: 'Your noise-cancelling headphones. You put them on. The world becomes slightly more manageable. You take them off again because you are at home and there is nothing to cancel.' },
        });
      }

      choices.push({
        id: 'open-tabs',
        label: 'Check the computer "just quickly"',
        action: {
          type: 'DISTRACTION',
          description: 'You sit down at the desk.',
          steps: [
            { text: 'You open the computer to check one thing. The browser has restored your previous session. There are forty-one tabs. You did not know you had forty-one tabs. You close seven of them. Three of them were things you actually needed.', focusDelta: -8, timeDelta: -12, chaosDelta: 15 },
            { text: 'You go to check the one thing. On the way there, you read an article that begins "You will not believe". You believe it. It was not worth believing.', focusDelta: -5, timeDelta: -10, chaosDelta: 12 },
            { text: 'You have now been sitting at the desk for twenty-two minutes. You have not checked the original thing. You close the laptop with the energy of someone making a decision.', focusDelta: -5, timeDelta: -8, chaosDelta: 8 },
          ],
        },
      });

      choices.push(exitChoice('Hallway', 'hallway', 'east'));
      return choices;
    },
  },

  hallway: {
    id: 'hallway',
    name: 'HALLWAY',
    description: (s) => {
      let desc = 'The hallway. A transitional space. You are in transit. Theoretically.';
      const needsKeys = !hasItem(s, 'keys');
      const needsMeds = !hasDone(s, 'took-meds');
      if (needsKeys || needsMeds) {
        desc += ' The front door is locked. ';
        if (needsKeys && needsMeds) desc += 'You do not have your keys or your medication.';
        else if (needsKeys) desc += 'You do not have your keys.';
        else desc += 'You have not taken your medication.';
      } else {
        desc += ' The front door is unlocked and you have everything you need. This is a notable achievement.';
      }
      if (s.chaos >= 34) desc += chaosInsert(s, ' There is an umbrella by the door. You are not sure if it will rain. You are not sure it matters.', ' A coat hangs on the hook. You do not know whose coat it is. You have lived here for three years.');
      return desc;
    },
    exits: { north: 'bedroom', east: 'home-office', south: 'kitchen' },
    choices: (s) => {
      const choices: Choice[] = [];
      const canLeave = hasItem(s, 'keys') && hasDone(s, 'took-meds');

      if (!hasItem(s, 'keys')) {
        choices.push({
          id: 'find-keys',
          label: 'Search for keys',
          action: {
            type: 'DISTRACTION',
            description: 'You begin looking for your keys.',
            completesAction: 'found-keys-hallway',
            steps: [
              { text: 'Not on the hook. Not on the table. Not in yesterday\'s jacket. The jacket that is, you notice, slightly damp. When did it get damp?', focusDelta: -5, timeDelta: -6, chaosDelta: 10 },
              { text: 'You check the kitchen counter. You check the bathroom. You check your bedroom twice. They are in your coat pocket. The coat you were already wearing.', focusDelta: -8, timeDelta: -8, chaosDelta: 12 },
            ],
          },
        });

        choices.push({
          id: 'take-spare-keys',
          label: 'Check the key bowl',
          action: { type: 'TAKE', item: 'keys', description: 'There is a bowl specifically for keys. You put the keys there every day so you will not lose them. The keys are not there. There is a button, a receipt, and one earring. You find the keys in your coat pocket.' },
        });
      }

      if (canLeave) {
        choices.push({
          id: 'leave-house',
          label: 'Leave the house',
          action: { type: 'MOVE', to: 'commute' },
        });
      } else {
        choices.push({
          id: 'try-leave',
          label: 'Try to leave',
          action: { type: 'EXAMINE', description: !hasItem(s, 'keys') && !hasDone(s, 'took-meds') ? 'You cannot leave. You do not have your keys and you have not taken your medication. The day is aware of this.' : !hasItem(s, 'keys') ? 'You cannot leave without your keys. You know this. The door knows this.' : 'You should take your medication before leaving. Future you is already annoyed at present you about this.' },
        });
      }

      choices.push(exitChoice('Bedroom', 'bedroom', 'north'));
      choices.push(exitChoice('Home Office', 'home-office', 'east'));
      choices.push(exitChoice('Kitchen', 'kitchen', 'south'));
      return choices;
    },
  },

  kitchen: {
    id: 'kitchen',
    name: 'KITCHEN',
    description: (s) => {
      let desc = 'The kitchen. There is food here. Whether you will eat it before leaving is a matter of statistical uncertainty.';
      if (s.chaos >= 34) desc += ' A mug from yesterday is on the counter. You decide it is still fine. You are making this decision with approximately forty percent of your available reasoning.';
      if (hasDone(s, 'ate-breakfast')) desc += ' You have eaten something. Your body has acknowledged this.';
      if (hasItem(s, 'coffee')) desc += ' There is coffee in your hand. Things are, comparatively, better.';
      if (s.chaos >= 67) desc += ' The fridge hums. You have never noticed the fridge humming before. You cannot stop noticing it now.';
      return desc;
    },
    exits: { north: 'hallway', east: 'backyard' },
    choices: (s) => {
      const choices: Choice[] = [];

      if (!hasItem(s, 'coffee')) {
        choices.push({
          id: 'make-coffee',
          label: 'Make coffee',
          action: { type: 'TAKE', item: 'coffee', description: 'You make coffee. The kettle takes three minutes. During those three minutes you start a task, abandon it, check your phone, put your phone down, and forget what you were doing. The coffee is ready. This is the win.' },
        });
      }

      if (!hasDone(s, 'ate-breakfast')) {
        choices.push({
          id: 'eat-breakfast',
          label: 'Eat something',
          action: { type: 'TASK', description: 'You eat. It is not a notable meal. It is fuel. Your body processes it with the quiet dignity of someone who has given up expecting more.', focusDelta: 10, timeDelta: -6, completesAction: 'ate-breakfast' },
        });

        choices.push({
          id: 'skip-breakfast',
          label: 'Skip breakfast, you\'re running late',
          action: { type: 'EXAMINE', description: 'You decide to skip breakfast. This decision will revisit you at approximately 11am, when you become irritable for reasons that will seem mysterious to everyone around you, including yourself.' },
        });
      }

      choices.push({
        id: 'scroll-kitchen',
        label: 'Check phone while waiting for kettle',
        action: {
          type: 'DISTRACTION',
          description: 'You pick up your phone while the kettle boils.',
          steps: [
            { text: 'You open an app. A different app opens. You are not sure when you switched apps. Both apps contain information you did not want.', focusDelta: -5, timeDelta: -8, chaosDelta: 10 },
            { text: 'The kettle finished five minutes ago. The coffee is lukewarm. You drink it anyway. It is a transaction between you and the concept of morning.', focusDelta: -5, timeDelta: -5, chaosDelta: 5 },
          ],
        },
      });

      if (!hasItem(s, 'travel-card')) {
        choices.push({
          id: 'find-travel-card',
          label: 'Look for travel card',
          action: { type: 'TAKE', item: 'travel-card', description: 'It is in the fruit bowl. You do not have fruit in the fruit bowl. You have a travel card, a battery, and one dried-out pen. The fruit bowl is aspirational storage.' },
        });
      }

      choices.push(exitChoice('Hallway', 'hallway', 'north'));
      choices.push(exitChoice('Backyard', 'backyard', 'east'));
      return choices;
    },
  },

  backyard: {
    id: 'backyard',
    name: 'BACKYARD',
    description: (s) => {
      let desc = 'The backyard. You came out here for a reason. The reason has already left.';
      if (s.chaos >= 34) desc += ' A plant you have been meaning to water for six weeks is here. It looks fine. It is not fine. It has simply decided to appear fine as a coping strategy.';
      if (s.chaos >= 67) desc += ' You notice a spider web in the corner. You consider the spider\'s productivity. The spider has built something. The spider did not spend forty minutes looking at their phone this morning. You resent the spider briefly and then feel embarrassed about this.';
      return desc;
    },
    exits: { west: 'kitchen' },
    choices: (_s) => {
      const choices: Choice[] = [];

      choices.push({
        id: 'water-plant',
        label: 'Water the plant',
        action: {
          type: 'DISTRACTION',
          description: 'You decide to water the plant.',
          steps: [
            { text: 'You water the plant. While watering, you notice the garden is "a bit much." You decide to tidy it. You pull three weeds. You are now gardening. You did not plan to garden.', focusDelta: -5, timeDelta: -10, chaosDelta: 15 },
            { text: 'Twenty minutes later you have reorganised a corner of the garden, found a trowel you thought you\'d lost, and completely forgotten why you came outside. The plant is watered though.', focusDelta: -5, timeDelta: -15, chaosDelta: 12 },
          ],
        },
      });

      choices.push({
        id: 'just-stand',
        label: 'Stand here for a moment',
        action: { type: 'EXAMINE', description: 'You stand in the backyard. It is quiet. Your brain begins to generate tasks you cannot do right now. You go back inside.' },
      });

      choices.push(exitChoice('Kitchen', 'kitchen', 'west'));
      return choices;
    },
  },

  commute: {
    id: 'commute',
    name: 'COMMUTE',
    description: (s) => {
      let desc = 'You are on the commute. Statistically, this is where most of your good ideas occur. None of them will be recorded.';
      if (!hasItem(s, 'travel-card')) desc += ' You are paying the penalty fare. This has happened before. It will happen again. It is simply part of the commute economy now.';
      if (s.chaos >= 34) desc += ' A man across from you is eating a meal that should not exist on public transport. You say nothing. Everyone says nothing. This is the social contract.';
      if (s.chaos >= 67) desc += ' The train announcements are slightly wrong. Not wrong enough to act on, but wrong enough to think about. You think about them.';
      return desc;
    },
    exits: { east: 'office-lobby' },
    choices: (_s) => {
      const choices: Choice[] = [];

      choices.push({
        id: 'listen-podcast',
        label: 'Listen to a podcast',
        action: {
          type: 'DISTRACTION',
          description: 'You put on a podcast.',
          steps: [
            { text: 'It is an interview. The interviewer keeps interrupting. You relate to the interviewee. You also relate to the interviewer. This is confusing.', focusDelta: -3, timeDelta: -10, chaosDelta: 5 },
            { text: 'You have arrived at your stop. You were listening to the podcast. You were also nowhere near the podcast. Both things were true simultaneously.', focusDelta: 5, timeDelta: 0, chaosDelta: -5 },
          ],
        },
      });

      choices.push({
        id: 'plan-day',
        label: 'Plan the day in your head',
        action: {
          type: 'TASK',
          description: 'You mentally plan the day. The plan is detailed and comprehensive. By the time you reach your stop, you have forgotten eighty percent of it, but the twenty percent that remains is the important twenty percent. Probably.',
          focusDelta: 8, timeDelta: -5, chaosDelta: -8, completesAction: 'planned-day',
        },
      });

      choices.push({
        id: 'scroll-commute',
        label: 'Scroll phone for the whole journey',
        action: {
          type: 'DISTRACTION',
          description: 'You open your phone.',
          steps: [
            { text: 'You scroll. Content passes. Some of it is interesting. Most of it is content-shaped content. You are consuming it at the rate of someone who has forgotten they have a destination.', focusDelta: -8, timeDelta: -8, chaosDelta: 15 },
            { text: 'You miss your stop. You get off at the next one. You walk the extra six minutes. You spend those six minutes mildly annoyed and then slightly over it.', focusDelta: -10, timeDelta: -12, chaosDelta: 10 },
          ],
        },
      });

      choices.push(exitChoice('Office', 'office-lobby', 'east'));
      return choices;
    },
  },

  'office-lobby': {
    id: 'office-lobby',
    name: 'OFFICE LOBBY',
    description: (s) => {
      let desc = 'The office lobby. It smells of air conditioning and the specific corporate optimism of motivational posters.';
      if (s.chaos >= 34) desc += ' There is a poster that says "Teamwork Makes The Dream Work." You think about who approved this poster. You think about the meeting in which it was approved. You feel something.';
      if (hasDone(s, 'badge-in')) desc += ' You are badged in. You exist, officially, within the building.';
      return desc;
    },
    exits: { west: 'commute', north: 'open-plan', east: 'break-room' },
    choices: (s) => {
      const choices: Choice[] = [];

      if (!hasDone(s, 'badge-in')) {
        choices.push({
          id: 'badge-in',
          label: 'Badge in',
          action: { type: 'TASK', description: 'You badge in. The machine beeps. You exist in the building now. This is what arriving looks like.', focusDelta: 0, timeDelta: -1, completesAction: 'badge-in' },
        });
      }

      choices.push({
        id: 'chat-lobby',
        label: 'Get trapped in a conversation with someone',
        action: {
          type: 'DISTRACTION',
          description: 'Someone says "Morning!" with the force of someone who does not require a response but will receive one anyway.',
          steps: [
            { text: 'You say "Morning!" back. They ask how your weekend was. You describe your weekend. It takes longer than the weekend itself.', focusDelta: -5, timeDelta: -8, chaosDelta: 8 },
            { text: 'They tell you about their weekend. At no point do either of you mention anything relevant to work. This is, you reflect, the most honest conversation you will have today.', focusDelta: -3, timeDelta: -7, chaosDelta: 5 },
          ],
        },
      });

      choices.push(exitChoice('Office Floor', 'open-plan', 'north'));
      choices.push(exitChoice('Break Room', 'break-room', 'east'));
      return choices;
    },
  },

  'break-room': {
    id: 'break-room',
    name: 'BREAK ROOM',
    description: (s) => {
      let desc = 'The break room. It contains a fridge with unclear ownership dynamics and a coffee machine that has a cult following.';
      if (s.chaos >= 34) desc += ' Someone has put a passive-aggressive note on the microwave. The note has been annotated by a second person. The second annotation has been responded to. This is now a document.';
      if (hasItem(s, 'coffee')) desc += ' You already have coffee. The coffee machine regards you with something like respect.';
      return desc;
    },
    exits: { west: 'office-lobby' },
    choices: (s) => {
      const choices: Choice[] = [];

      if (!hasItem(s, 'coffee')) {
        choices.push({
          id: 'get-office-coffee',
          label: 'Get coffee',
          action: { type: 'TAKE', item: 'coffee', description: 'You make coffee. Real coffee, from the machine that takes three button presses and a moment of hope. It is better than you deserve, which is the correct baseline for office coffee.' },
        });
      } else {
        choices.push({
          id: 'drink-coffee',
          label: 'Drink the coffee',
          action: { type: 'USE', item: 'coffee', description: 'You drink the coffee. Focus sharpens. The world has corners again.', focusDelta: 15, chaosDelta: -10, completesAction: 'drank-coffee' },
        });
      }

      choices.push({
        id: 'read-note',
        label: 'Read the passive-aggressive fridge note',
        action: {
          type: 'DISTRACTION',
          description: 'You read the note.',
          steps: [
            { text: '"If this is your yoghurt and you know it has been in here since Tuesday PLEASE consider others." The note is signed "Management (informal)."', focusDelta: -3, timeDelta: -5, chaosDelta: 8 },
            { text: 'You spend six minutes wondering who "Management (informal)" is. You develop three theories. None of them are provable. All of them are compelling.', focusDelta: -5, timeDelta: -8, chaosDelta: 10 },
          ],
        },
      });

      choices.push(exitChoice('Office Lobby', 'office-lobby', 'west'));
      return choices;
    },
  },

  'open-plan': {
    id: 'open-plan',
    name: 'OPEN PLAN OFFICE',
    description: (s) => {
      let desc = 'The open-plan office. Designed for collaboration. Currently being used for the performance of working.';
      if (s.chaos >= 34) desc += ' Someone nearby is on a call without headphones. They say "circle back" twice in one sentence. You note this. You do not know what you plan to do with the information.';
      if (s.chaos >= 67) desc += ' The ambient noise of the office is forming a rhythm. You are aware that you are now nodding to the ambient noise of the office.';
      if (hasDone(s, 'checked-emails')) desc += ' Your emails have been acknowledged. Several of them require responses. You know this.';
      return desc;
    },
    exits: { south: 'office-lobby', east: 'colleague-desk', north: 'meeting-room', west: 'your-desk' },
    choices: (s) => {
      const choices: Choice[] = [];

      if (!hasDone(s, 'checked-emails')) {
        choices.push({
          id: 'check-emails',
          label: 'Check emails',
          action: { type: 'TASK', description: 'You check your emails. There are thirty-one. Six of them require action. Two of those six are urgent. You flag all six, which is technically action.', focusDelta: -8, timeDelta: -10, chaosDelta: 8, completesAction: 'checked-emails' },
        });
      }

      if (hasDone(s, 'checked-emails') && !hasDone(s, 'replied-urgent')) {
        choices.push({
          id: 'reply-urgent',
          label: 'Reply to the urgent email',
          action: { type: 'TASK', description: 'You write the reply. You rewrite the reply. You rewrite the subject line even though you cannot change it. You send it. You immediately wonder if it was too formal. It was not too formal.', focusDelta: -10, timeDelta: -12, chaosDelta: 5, completesAction: 'replied-urgent' },
        });
      }

      choices.push({
        id: 'reorganise-desk-area',
        label: 'Reorganise your desk area instead of working',
        action: {
          type: 'DISTRACTION',
          description: 'You decide the desk area needs reorganising before you can do anything.',
          steps: [
            { text: 'This is true and also not true simultaneously. You move your monitor two centimetres to the left. You move it back. You adjust the keyboard.', focusDelta: -5, timeDelta: -10, chaosDelta: 12 },
            { text: 'The desk is now arranged in a way that feels better but is functionally identical. You are ready to work. You have been ready to work for twenty minutes. This is fine.', focusDelta: -5, timeDelta: -8, chaosDelta: 8 },
          ],
        },
      });

      choices.push(exitChoice('Your Desk', 'your-desk', 'west'));
      choices.push(exitChoice('Colleague\'s Desk', 'colleague-desk', 'east'));
      choices.push(exitChoice('Meeting Room', 'meeting-room', 'north'));
      choices.push(exitChoice('Lobby', 'office-lobby', 'south'));
      return choices;
    },
  },

  'colleague-desk': {
    id: 'colleague-desk',
    name: 'COLLEAGUE\'S DESK',
    description: (s) => {
      let desc = 'Your colleague\'s desk. They are not here. Their screensaver is a fish tank. The fish are peaceful. You watch them for a moment. You wish you were a fish in a screensaver.';
      if (s.chaos >= 34) desc += ' Their desk is neat. Ostentatiously neat. Performatively neat. You take no pleasure in this observation. Some pleasure.';
      return desc;
    },
    exits: { west: 'open-plan' },
    choices: (_s) => {
      const choices: Choice[] = [];

      choices.push({
        id: 'ask-colleague',
        label: 'Wait for colleague to ask about that thing',
        action: {
          type: 'DISTRACTION',
          description: 'You wait. Your colleague arrives.',
          steps: [
            { text: '"Oh hey!" they say. You say the thing you wanted to ask. They answer it in forty seconds. You then talk for twenty-five minutes about something adjacent to the thing.', focusDelta: -5, timeDelta: -18, chaosDelta: 8 },
            { text: 'You return to your desk. The thing has been answered. You have also somehow agreed to review a document by Thursday. You are not sure when Thursday became an obligation.', focusDelta: -3, timeDelta: -5, chaosDelta: 5 },
          ],
        },
      });

      choices.push({
        id: 'stare-screensaver',
        label: 'Watch the fish screensaver',
        action: { type: 'EXAMINE', description: 'You watch the fish. They do not have meetings. They do not have emails. They do not exist, technically, which is its own kind of freedom.', chaosDelta: 5 },
      });

      choices.push(exitChoice('Open Plan', 'open-plan', 'west'));
      return choices;
    },
  },

  'meeting-room': {
    id: 'meeting-room',
    name: 'MEETING ROOM',
    description: (s) => {
      let desc = 'The meeting room. It is called "Synergy." Someone named this room. That person still works here.';
      if (!hasDone(s, 'attended-meeting')) desc += ' The meeting begins in, apparently, a moment. Several people are already looking at their laptops in a way that resembles preparation.';
      if (hasDone(s, 'attended-meeting')) desc += ' The meeting is over. A follow-up meeting has been scheduled to discuss the meeting. This is how meetings reproduce.';
      if (s.chaos >= 34) desc += ' The projector is being argued with. The argument is at the quiet, professional stage. Both parties know the outcome. The projector will win eventually.';
      return desc;
    },
    exits: { south: 'open-plan', east: 'bathroom-work' },
    choices: (s) => {
      const choices: Choice[] = [];

      if (!hasDone(s, 'attended-meeting')) {
        choices.push({
          id: 'attend-meeting',
          label: 'Attend the meeting',
          action: { type: 'TASK', description: 'You attend the meeting. You understand eighty percent of it. The other twenty percent is acronyms that no one has defined but everyone is using. You nod when others nod. This is professional synchronisation.', focusDelta: -12, timeDelta: -20, chaosDelta: 10, completesAction: 'attended-meeting' },
        });

        choices.push({
          id: 'zone-out-meeting',
          label: 'Attend the meeting (mentally optional)',
          action: {
            type: 'DISTRACTION',
            description: 'You are in the meeting. Your body is in the meeting.',
            steps: [
              { text: 'Your mind is elsewhere. Specifically it is thinking about whether penguins have knees. You pull out your phone under the table and look this up. They do. Penguins have knees. This is important.', focusDelta: -5, timeDelta: -15, chaosDelta: 18 },
              { text: 'Someone says your name. Everyone looks at you. You say "absolutely, yes, that makes sense." This answer is applicable to approximately seventy percent of meeting questions. Today it was the correct one.', focusDelta: -8, timeDelta: -8, chaosDelta: 10 },
            ],
          },
        });
      }

      choices.push(exitChoice('Open Plan', 'open-plan', 'south'));
      choices.push(exitChoice('Bathroom', 'bathroom-work', 'east'));
      return choices;
    },
  },

  'bathroom-work': {
    id: 'bathroom-work',
    name: 'WORK BATHROOM',
    description: (s) => {
      let desc = 'The work bathroom. The only room in the building that does not have a meeting scheduled in it.';
      if (s.chaos >= 34) desc += ' Someone has left a motivational quote above the sink. "You got this!" it says. You assess whether you have got this. The assessment is inconclusive.';
      if (s.chaos >= 67) desc += ' You have been in here for four minutes. This is either a break or a strategy. You are not sure it matters which.';
      return desc;
    },
    exits: { west: 'meeting-room' },
    choices: (_s) => {
      const choices: Choice[] = [];

      choices.push({
        id: 'bathroom-break',
        label: 'Take a genuine bathroom break',
        action: { type: 'TASK', description: 'You take a moment. Just a moment. The bathroom is quiet. No one is asking you anything in here. You stay one minute longer than necessary. This is self-care, loosely defined.', focusDelta: 8, timeDelta: -3, chaosDelta: -8, completesAction: 'took-bathroom-break' },
      });

      choices.push({
        id: 'phone-bathroom',
        label: 'Check phone in here because it\'s quiet',
        action: {
          type: 'DISTRACTION',
          description: 'You check your phone in the bathroom.',
          steps: [
            { text: 'Eight minutes pass. You have read two articles, replied to a message, and watched the beginning of a video about a dog that learned to open doors. The dog\'s name is Trevor.', focusDelta: -5, timeDelta: -8, chaosDelta: 10 },
            { text: 'Someone knocks on the door. You leave. You have not found out how the Trevor story ends. This will bother you.', focusDelta: -5, timeDelta: -3, chaosDelta: 8 },
          ],
        },
      });

      choices.push(exitChoice('Meeting Room', 'meeting-room', 'west'));
      return choices;
    },
  },

  'your-desk': {
    id: 'your-desk',
    name: 'YOUR DESK',
    description: (s) => {
      let desc = 'Your desk. This is where the work happens. Or near where the work happens. In the general vicinity of where the work is supposed to happen.';
      if (hasDone(s, 'wrote-report')) desc += ' The report is done. You have sent it. This is an objective fact about the world.';
      if (hasDone(s, 'filled-timesheet')) desc += ' The timesheet has been filled in. Largely accurately.';
      if (s.chaos >= 34) desc += ' Your desktop background is a photo from a holiday two years ago. You were happy in this photo. You had fewer tabs open.';
      if (s.chaos >= 67) desc += ' The screen blur from staring is setting in. The words are doing a thing. You blink. They stop doing the thing. You are not sure the thing happened.';
      return desc;
    },
    exits: { east: 'open-plan', north: 'supply-closet' },
    choices: (s) => {
      const choices: Choice[] = [];

      if (!hasDone(s, 'wrote-report')) {
        choices.push({
          id: 'write-report',
          label: 'Write the report',
          requiresItem: hasDone(s, 'found-report-draft') ? undefined : undefined,
          action: { type: 'TASK', description: 'You write the report. It takes two hours and thirty-seven minutes. The actual writing takes forty minutes. The rest is preparation, staring, one accidental nap, and a brief detour into researching the history of a word you used in the second paragraph.', focusDelta: -20, timeDelta: -25, chaosDelta: 5, completesAction: 'wrote-report' },
        });
      }

      if (!hasDone(s, 'filled-timesheet')) {
        choices.push({
          id: 'fill-timesheet',
          label: 'Fill in timesheet',
          action: { type: 'TASK', description: 'You fill in the timesheet. Monday is a reconstruction. Tuesday you remember clearly because of the incident with the printer. Wednesday through Thursday are estimates based on vibes. Friday is this meeting plus several approximations. You submit it. It is close enough to the truth to be legal.', focusDelta: -8, timeDelta: -8, completesAction: 'filled-timesheet' },
        });
      }

      if (hasDone(s, 'wrote-report') && !hasDone(s, 'sent-report')) {
        choices.push({
          id: 'send-report',
          label: 'Send the report',
          action: { type: 'TASK', description: 'You re-read the report. You change one word. You change it back. You send it. You immediately read the first sentence again and wonder if the tone is right. The tone is fine. The tone has always been fine.', focusDelta: -5, timeDelta: -3, completesAction: 'sent-report' },
        });
      }

      choices.push({
        id: 'deep-work',
        label: 'Put headphones on and try to focus',
        requiresItem: 'headphones',
        action: { type: 'TASK', description: 'You put on your headphones. The noise cancels. A cone of near-silence forms around you. You work. Actually work. For thirty-seven uninterrupted minutes you are a person who does things. It is excellent. You are briefly your best self.', focusDelta: 15, timeDelta: -15, chaosDelta: -15, completesAction: 'deep-work-session' },
      });

      choices.push({
        id: 'rabbit-hole',
        label: 'Look something up "just quickly"',
        action: {
          type: 'DISTRACTION',
          description: 'You search for one thing.',
          steps: [
            { text: 'The thing is answered in thirty seconds. The related articles column exists. You click one. You are now reading about the Roman Empire. This was not the plan.', focusDelta: -5, timeDelta: -8, chaosDelta: 12 },
            { text: 'Forty-five minutes have passed. You know a great deal about Roman infrastructure. You know exactly as much about your actual work as you did before. These are both true.', focusDelta: -8, timeDelta: -15, chaosDelta: 15 },
          ],
        },
      });

      choices.push(exitChoice('Open Plan', 'open-plan', 'east'));
      choices.push(exitChoice('Supply Closet', 'supply-closet', 'north'));
      return choices;
    },
  },

  'supply-closet': {
    id: 'supply-closet',
    name: 'SUPPLY CLOSET',
    description: (s) => {
      let desc = 'You have opened the supply closet. It smells of cardboard and the organisational intentions of a previous era. Post-its. Reams of paper. A label maker that no one remembers purchasing.';
      if (s.chaos >= 67) desc += ' In the back, behind the A4 paper, there is a chair. Someone has put a chair in the supply closet. You do not investigate this further because some questions are better left as questions.';
      return desc;
    },
    exits: { south: 'your-desk' },
    choices: (s) => {
      const choices: Choice[] = [];

      choices.push({
        id: 'label-things',
        label: 'Use the label maker',
        action: {
          type: 'DISTRACTION',
          description: 'You pick up the label maker.',
          steps: [
            { text: '"PENS" you label a pot of pens. "SCISSORS" you label the scissors. You label the stapler "STAPLER." You are providing a service. No one asked for this service.', focusDelta: -3, timeDelta: -8, chaosDelta: 20 },
            { text: 'You label your own hand "HAND." You take a photo. You send it to no one. You put the label maker back. You have been in the supply closet for nineteen minutes.', focusDelta: -5, timeDelta: -10, chaosDelta: 15 },
          ],
        },
      });

      if (!hasDone(s, 'found-chair')) {
        choices.push({
          id: 'sit-in-chair',
          label: 'Sit in the mysterious chair',
          action: { type: 'TASK', description: 'You sit in the chair. It is surprisingly comfortable. You sit here for six minutes doing absolutely nothing, which is the most deliberate nothing you have done all day. This is the supply closet. This is the most honest room in the building.', focusDelta: 20, timeDelta: -6, chaosDelta: -20, completesAction: 'found-chair' },
        });
      }

      choices.push(exitChoice('Your Desk', 'your-desk', 'south'));
      return choices;
    },
  },

  'commute-home': {
    id: 'commute-home',
    name: 'COMMUTE HOME',
    description: (s) => {
      let desc = 'You are going home. The day is behind you. What you did with it is now historical fact, which is either comforting or alarming depending on what you did with it.';
      if (s.chaos >= 34) desc += ' The train is full. You are standing. Someone\'s bag is against your arm. You have chosen not to address this. This is the commute.';
      if (hasDone(s, 'planned-day')) desc += ' You think about the plan you made this morning. Some of it happened. None of it happened exactly.';
      return desc;
    },
    exits: {},
    choices: (_s) => [
      {
        id: 'end-game',
        label: 'Arrive home. End the day.',
        action: { type: 'MOVE', to: 'commute-home' },
      },
    ],
  },
};
