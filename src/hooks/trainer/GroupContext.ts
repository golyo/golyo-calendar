import { createContext } from 'react';
import { TrainerEvent } from '../event';
import { MembershipType, MemberState, TrainingGroupType, TrainingGroupUIType } from './TrainerContext';

interface GroupContextType {
  attachedGroups: TrainingGroupType[];
  loadEvent: (eventId: string) => Promise<TrainerEvent>;
  group: TrainingGroupUIType | undefined;
  groupMembers: MembershipType[];
  updateMembershipState: (membership: MembershipType, toState: MemberState | null) => Promise<any>;
}

const GroupContext = createContext<GroupContextType>({} as GroupContextType);

export default GroupContext;