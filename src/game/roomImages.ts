import bedroom from '../assets/rooms/bedroom.png';
import bathroomHome from '../assets/rooms/bathroom-home.png';
import homeOffice from '../assets/rooms/home-office.png';
import hallway from '../assets/rooms/hallway.png';
import kitchen from '../assets/rooms/kitchen.png';
import backyard from '../assets/rooms/backyard.png';
import commute from '../assets/rooms/commute.png';
import officeLobby from '../assets/rooms/office-lobby.png';
import breakRoom from '../assets/rooms/break-room.png';
import openPlan from '../assets/rooms/open-plan.png';
import colleagueDesk from '../assets/rooms/colleague-desk.png';
import meetingRoom from '../assets/rooms/meeting-room.png';
import bathroomWork from '../assets/rooms/bathroom-work.png';
import yourDesk from '../assets/rooms/your-desk.png';
import supplyCloset from '../assets/rooms/supply-closet.png';
import commuteHome from '../assets/rooms/commute-home.png';
import type { RoomId } from './types';

export const ROOM_IMAGES: Record<RoomId, string> = {
  bedroom,
  'bathroom-home': bathroomHome,
  'home-office': homeOffice,
  hallway,
  kitchen,
  backyard,
  commute,
  'office-lobby': officeLobby,
  'break-room': breakRoom,
  'open-plan': openPlan,
  'colleague-desk': colleagueDesk,
  'meeting-room': meetingRoom,
  'bathroom-work': bathroomWork,
  'your-desk': yourDesk,
  'supply-closet': supplyCloset,
  'commute-home': commuteHome,
};
