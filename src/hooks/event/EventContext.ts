export interface CalendarEvent {
  id: string;
  title: string;
  text: string;
  startDate: Date;
  endDate: Date;
  color?: string;
}

export interface EventMember {
  id: string;
  name: string;
}

export interface TrainerEvent extends CalendarEvent {
  trainerId: string;
  groupId: string;
  members: EventMember[];
  maxMember: number;
}

export interface EventProvider {
  getEvents: (from: Date, to: Date) => Promise<TrainerEvent[]>;
  setGroupRestriction: (groupId: string | undefined) => void;
}
