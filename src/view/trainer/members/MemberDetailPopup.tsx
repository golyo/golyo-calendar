import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, IconButton, Modal } from '@mui/material';
import { Visibility } from '@mui/icons-material';
import ModalContainer from '../../common/ModalContainer';
import {
  MemberState,
  MembershipType,
  TRAINER_STATE_MAP,
  getButtonVariant,
  ActionButton, useGroup,
} from '../../../hooks/trainer';
import LabelValue from '../../common/LabelValue';
import { useDialog } from '../../../hooks/dialog';
import ModifyTicketPopup from './ModifyTicketPopup';
import { TicketSheet } from '../../../hooks/trainer/TrainerContext';

interface Props {
  sheet: TicketSheet;
  member: MembershipType;
}

const MemberDetailPopup = ({ sheet, member }: Props) => {
  const { t } = useTranslation();
  const { showConfirmDialog } = useDialog();
  const [open, setOpen] = useState(false);
  const { group, updateMembershipState, buySeasonTicket, updateMembership } = useGroup();

  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);

  const doAction = useCallback((button: ActionButton) => {
    showConfirmDialog({
      description: t(`confirm.setStateByTrainer.${button.toState || 'null'}`),
      okCallback: () => {
        updateMembershipState(member, button.toState);
        closeModal();
      },
    });
  }, [closeModal, member, showConfirmDialog, t, updateMembershipState]);

  const buyTicket = useCallback(() => {
    showConfirmDialog({
      description: t('confirm.buySeasonTicket'),
      okCallback: () => {
        buySeasonTicket(member.id);
        closeModal();
      },
    });
  }, [buySeasonTicket, closeModal, member.id, showConfirmDialog, t]);

  const isRemoveabe = useMemo(() => member.groups.length > 1 && member.groups.includes(group!.id), [group, member.groups]);

  const removeFromGroup = useCallback(() => {
    showConfirmDialog({
      description: t('confirm.removeFromGroup'),
      okCallback: () => {
        const idx = member.groups.indexOf(group!.id);
        member.groups.splice(idx, 1);
        updateMembership(member).then(() => closeModal());
      },
    });
  }, [closeModal, group, member, showConfirmDialog, t, updateMembership]);

  const actionButtons = useMemo(() => {
    return TRAINER_STATE_MAP[member.state || ''];
  }, [member.state]);

  return (
    <>
      <IconButton onClick={openModal}>
        <Visibility />
      </IconButton>
      <Modal
        open={open}
        onClose={closeModal}
      >
        <ModalContainer variant="big" close={closeModal} title={t('membership.details')}>
          <div className="vertical">
            <LabelValue label={t('login.email')}>
              { member.id }
            </LabelValue>
            <LabelValue label={t('login.userName')}>
              { member.name }
            </LabelValue>
            <LabelValue label={t('membership.state')}>
              {t(`memberState.${member.state}`)}
            </LabelValue>
            <LabelValue label={t('membership.remainingEventNo')}>
              <span style={{ paddingRight: '20px' }}>{sheet.remainingEventNo}</span>
              <ModifyTicketPopup sheet={sheet} membership={member} />
            </LabelValue>
            <LabelValue label={t('membership.purchasedTicketNo')}>
              {sheet.purchasedTicketNo}
            </LabelValue>
            <div className="horizontal">
              {member.state === MemberState.ACCEPTED && <Button onClick={buyTicket} variant="contained">{t('action.buySeasonTicket')}</Button>}
              {actionButtons.map((button, idx) => (
                <Button key={idx} variant={getButtonVariant(idx)} onClick={() => doAction(button)}>{t(button.label)}</Button>
              ))}
              {isRemoveabe && <Button onClick={removeFromGroup} variant="outlined">{t('action.removeFromGroup')}</Button>}
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

export default MemberDetailPopup;