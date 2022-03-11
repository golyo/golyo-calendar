import { createContext } from 'react';
import { TrainerEvent } from '../event';
import { MembershipType, MemberState, TrainingGroupType, TrainingGroupUIType } from './TrainerContext';

interface GroupContextType {
  attachedGroups: TrainingGroupType[];
  buySeasonTicket: (memberId: string) => Promise<MembershipType>;
  loadEvent: (eventId: string) => Promise<TrainerEvent>;
  removeMemberFromEvent: (eventId: string, memberId: string, ticketBack: boolean) => Promise<TrainerEvent>;
  group: TrainingGroupUIType | undefined;
  groupMembers: MembershipType[];
  updateMembership: (membership: MembershipType) => Promise<void>;
  updateMembershipState: (membership: MembershipType, toState: MemberState | null) => Promise<any>;
}

const GroupContext = createContext<GroupContextType>({} as GroupContextType);

export default GroupContext;