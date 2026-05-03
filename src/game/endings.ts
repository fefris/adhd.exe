import type { Ending, PlayerState } from './types';

function hasDone(s: PlayerState, a: string) {
  return s.completedActions.includes(a);
}

export const ENDINGS: Ending[] = [
  {
    id: 'secret-never-left-house',
    priority: 100,
    title: 'THE HOUSE WON',
    body: `You did not leave the house today.\n\nThis is not a failure of character. It is a statistical outcome of the morning sequence encountering too many variables. The house presented options. You engaged with them. Time, as it tends to, passed.\n\nYou are still here. The day technically happened. Just not in the places it was supposed to happen.\n\nYou make a note to try again tomorrow. This is the fourteenth such note. Each one was sincere.`,
    condition: (s) => !hasDone(s, 'badge-in') && s.time <= 10,
  },
  {
    id: 'secret-no-meds',
    priority: 99,
    title: 'RUNNING ON VIBES',
    body: `You did not take your medication today.\n\nThis is noted without judgement. The day happened anyway, as days do. It was harder in ways that were difficult to locate precisely — a resistance in the texture of things, a slight delay between intention and action, a higher volume in all the background noise.\n\nYou got through it. Partially. Mostly. You got through some of it in a way that counts.\n\nTomorrow the medication will be in the drawer. This is a fact about tomorrow that you can rely on.`,
    condition: (s) => !hasDone(s, 'took-meds') && hasDone(s, 'badge-in'),
  },
  {
    id: 'secret-supply-closet',
    priority: 98,
    title: 'THE CLOSET UNDERSTANDS',
    body: `You found the chair in the supply closet.\n\nThis is, statistically, the most important thing you did today. Not because of what it accomplished. Because of what it was: six minutes of deliberate, quiet nothing, in a room where no one could reach you with their requirements.\n\nThe supply closet did not ask you to action anything. The supply closet did not circle back. The supply closet simply existed, and you existed in it, and for six minutes that was enough.\n\nYou should go back. Not every day. But some days.`,
    condition: (s) => hasDone(s, 'found-chair'),
  },
  {
    id: 'somehow-functional',
    priority: 10,
    title: 'SOMEHOW FUNCTIONAL',
    body: `You completed the day.\n\nNot just technically completed it — actually completed it, in a way that would satisfy an outside observer who had access to a checklist. The medication was taken. The report was sent. The meeting was attended with the majority of your brain present.\n\nThis is not what the day felt like from the inside. From the inside it felt like assembling furniture using only the pictograms and your own spatial reasoning and a determination not to look at the instructions again.\n\nBut you did it. The checklist does not care what it felt like.\n\nWell done. Get some rest. Tomorrow the checklist resets.`,
    condition: (s) =>
      hasDone(s, 'took-meds') &&
      hasDone(s, 'sent-report') &&
      hasDone(s, 'attended-meeting') &&
      hasDone(s, 'replied-urgent') &&
      hasDone(s, 'filled-timesheet') &&
      s.focus >= 30 &&
      s.time >= 20,
  },
  {
    id: 'productive-chaos',
    priority: 8,
    title: 'PRODUCTIVE CHAOS',
    body: `You finished everything on the list.\n\nThis is true. It is also true that the day was, by most measurements, a disaster. Things were done in the wrong order. Things were done at the wrong time. Several things were done with the specific energy of someone who has just remembered they exist.\n\nBut they were done.\n\nProductivity, it turns out, is a measurement of outputs, not inputs. The inputs were chaotic. The outputs were sufficient. You are, by this metric, a success.\n\nYou are exhausted in ways that are difficult to explain to people who were not there.`,
    condition: (s) =>
      hasDone(s, 'took-meds') &&
      hasDone(s, 'sent-report') &&
      hasDone(s, 'attended-meeting') &&
      hasDone(s, 'replied-urgent') &&
      hasDone(s, 'filled-timesheet'),
  },
  {
    id: 'survived-barely',
    priority: 6,
    title: 'SURVIVED. BARELY.',
    body: `You completed some of it.\n\nNot all of it. A meaningful subset. The important stuff, mostly, give or take a few things that were important in ways that aren't immediately obvious.\n\nThe day is over. You survived it. This is the minimum required outcome and you achieved it, which is not nothing.\n\nTomorrow the list will be similar. Some things will carry over. Some things will be new. You will approach it with the same mixture of intention and chaos that produced today's result, which is: approximately this.`,
    condition: (s) => s.completedActions.length >= 4 && s.time > 0,
  },
  {
    id: 'hyperfocus-void',
    priority: 5,
    title: 'THE HYPERFOCUS VOID',
    body: `You went very deep on something that was not the thing.\n\nIt started with a small detour. The detour was interesting. The detour had related detours. Those detours had implications. At some point you were no longer detouring — you were simply somewhere else, completely, and the original thing was a rumour.\n\nYou know a great deal now about something that was not on your to-do list. This knowledge is real. It just isn't useful, in the specific way that today required things to be useful.\n\nThe information is yours. The day is gone. These are both true and you have to carry them home together.`,
    condition: (s) => s.chaos >= 80 && s.time > 0,
  },
  {
    id: 'chaos-consumed-you',
    priority: 1,
    title: 'CHAOS CONSUMED YOU',
    body: `The day is over.\n\nYou were there for it. Technically. Physically present in a series of locations where the day was happening. The day happened around you in the way weather happens around a person standing outside — you were in it, you were affected by it, but the relationship between you and it was not one of control.\n\nThis is not a moral judgement. The day asked things of you and you answered with different things, repeatedly, because the different things were more present and more interesting and occasionally more urgent in ways that turned out to be illusory.\n\nThe day is over. Tomorrow is not yet asking anything of you.\n\nSit with that for a moment.`,
    condition: () => true,
  },
];
