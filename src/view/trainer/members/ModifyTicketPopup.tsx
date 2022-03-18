import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, IconButton, Modal, TextField } from '@mui/material';
import { Edit } from '@mui/icons-material';
import { MembershipType, useGroup } from '../../../hooks/trainer';
import ModalContainer from '../../common/ModalContainer';
import LabelValue from '../../common/LabelValue';
import { TicketSheet } from '../../../hooks/trainer/TrainerContext';

const ModifyTicketPopup = ({ membership, sheet }: { membership: MembershipType, sheet: TicketSheet }) => {
  const { t } = useTranslation();

  const { updateMembership } = useGroup();
  const [open, setOpen] = useState(false);
  const [newValue, setNewValue] = useState<number>(sheet.remainingEventNo);
  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);

  const updateTicketEvent = useCallback(() => {
    sheet.remainingEventNo = newValue;
    updateMembership(membership).then(() => closeModal());
  }, [closeModal, membership, newValue, sheet, updateMembership]);

  return (
    <>
      <IconButton onClick={openModal}>
        <Edit color="primary" />
      </IconButton>
      <Modal
        open={open}
        onClose={closeModal}
      >
        <ModalContainer variant="big" open={open} close={closeModal} title={t('membership.modifyTicketNo')}>
          <div className="vertical">
            <LabelValue label={t('login.userName')}>
              { membership.name }
            </LabelValue>
            <LabelValue label={t('membership.remainingEventNo')}>
              { sheet.remainingEventNo }
            </LabelValue>
            <LabelValue label={t('membership.changeEventNo')}>
              <TextField
                sx={{ width: '150px' }}
                size="small"
                value={newValue}
                variant="outlined"
                type="number"
                onChange={(e) => setNewValue(parseInt(e.target.value))}
              />
            </LabelValue>
            <div className="horizontal">
              <Button color="primary" variant="contained" onClick={updateTicketEvent}>
                {t('common.save')}
              </Button>
              <Button color="primary" onClick={closeModal}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </ModalContainer>
      </Modal>
    </>
  );
};

export default ModifyTicketPopup;