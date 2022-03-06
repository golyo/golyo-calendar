import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, IconButton, Modal, TextField } from '@mui/material';
import { Edit } from '@mui/icons-material';
import { MembershipType, useGroup } from '../../../hooks/trainer';
import ModalContainer from '../../common/ModalContainer';
import ModalTitle from '../../common/ModalTitle';
import LabelValue from '../../common/LabelValue';

const ModifyTicketPopup = ({ membership }: { membership: MembershipType }) => {
  const { t } = useTranslation();

  const { updateMembership } = useGroup();
  const [open, setOpen] = useState(false);
  const [newValue, setNewValue] = useState<number>(membership.remainingEventNo);
  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);

  const updateTicketEvent = useCallback(() => {
    membership.remainingEventNo = newValue;
    updateMembership(membership).then(() => closeModal());
  }, [closeModal, membership, newValue, updateMembership]);

  return (
    <>
      <IconButton onClick={openModal}>
        <Edit color="primary" />
      </IconButton>
      <Modal
        open={open}
        onClose={closeModal}
      >
        <ModalContainer variant="big">
          <ModalTitle close={closeModal}>{ t('membership.modifyTicketNo') }</ModalTitle>
          <div className="vertical">
            <LabelValue label={t('login.userName')}>
              { membership.name }
            </LabelValue>
            <LabelValue label={t('membership.remainingEventNo')}>
              { membership.remainingEventNo }
            </LabelValue>
            <div>
              <TextField
                sx={{ width: '150px' }}
                size="small"
                value={newValue}
                label={t('membership.changeEventNo')}
                variant="outlined"
                type="number"
                onChange={(e) => setNewValue(parseInt(e.target.value))}
              />
            </div>
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