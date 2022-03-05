import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Avatar,
  Box,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemAvatar,
  MenuItem,
  TextField,
  Typography,
} from '@mui/material';

import NewMemberPopup from './NewMemberPopup';
import { MemberState, useGroup } from '../../../hooks/trainer';
import MemberDetailPopup from './MemberDetailPopup';
import { TicketNoWarning } from '../events/EventPage';

const STATES = Object.values(MemberState) as MemberState[];

const MembersList = () => {
  const { t } = useTranslation();
  const [selectedState, setSelectedState] = useState<MemberState | 0>(0);

  const { members, updateMembershipState, buySeasonTicket } = useGroup();

  const filteredMembers = useMemo(() => {
    if (!members) {
      return [];
    }
    if (!selectedState) {
      return members;
    }
    return members.filter((member) => member.state === selectedState);
  }, [members, selectedState]);

  const handleSelectChange = useCallback((event: React.ChangeEvent<any>) => setSelectedState(event.target.value), [setSelectedState]);

  if (!members) {
    return null;
  }
  return (
    <>
      <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
        <TextField select
                   onChange={handleSelectChange}
                   value={selectedState}
                   label={t('common.filter')}
                   size="small"
                   variant="standard"
                   sx={{ minWidth: '200px' }}
        >
          <MenuItem value={0}>{t('common.all')}</MenuItem>
          { STATES.map((state, idx) => <MenuItem key={idx} value={state}>{t(`memberState.${state}`)}</MenuItem>)}
        </TextField>
      </Box>
      <List>
        <Divider />
        {filteredMembers.map((member, idx) => (
          <ListItem key={idx}
                    secondaryAction={<MemberDetailPopup updateMembershipState={updateMembershipState} member={member} buySeasonTicket={buySeasonTicket} />}
                    divider
          >
            <ListItemAvatar>
              <Avatar src={member.avatar} />
            </ListItemAvatar>
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column' }}>
              <div className="horizontal" style={{ justifyContent: 'space-between' }}>
                <Typography variant="subtitle1">{member.name}</Typography>
                <Chip label={t(`memberState.${member.state}`)} color="primary" />
              </div>
              <div style={{ display: 'flex' }}>
                <TicketNoWarning member={member} t={t} />
              </div>
            </div>
          </ListItem>
        ))}
      </List>
      <div>
        <NewMemberPopup updateMembershipState={updateMembershipState}></NewMemberPopup>
      </div>
    </>
  );
};

export default MembersList;