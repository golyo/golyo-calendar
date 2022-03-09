import { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, IconButton, Modal } from '@mui/material';
import { Visibility } from '@mui/icons-material';
import ModalContainer from '../common/ModalContainer';
import { ActionButton, convertGroupToUi, getButtonVariant, MemberState, USER_STATE_MAP } from '../../hooks/trainer';
import LabelValue from '../common/LabelValue';
import { CronConverter, UserGroupMembership } from '../../hooks/user';
import GroupDetails from '../trainer/group/GroupDetails';
import { useDialog } from '../../hooks/dialog';

interface Props {
  groupMembership: UserGroupMembership;
  cronConverter: CronConverter;
  handleRequest: (member: UserGroupMembership, toState: MemberState | null) => Promise<void>;
}

const UserMembershipDetailPopup = ({ cronConverter, groupMembership, handleRequest }: Props) => {
  const { t } = useTranslation();
  const { showConfirmDialog } = useDialog();

  const [open, setOpen] = useState(false);
  const groupUi = useMemo(() => convertGroupToUi(groupMembership.group, cronConverter), [cronConverter, groupMembership.group]);
  const actionButtons = useMemo(() => {
    return USER_STATE_MAP[groupMembership.membership.state || ''];
  }, [groupMembership.membership.state]);

  const openModal = useCallback(() => setOpen(true), []);
  const closeModal = useCallback(() => setOpen(false), []);
  const doAction = useCallback((button: ActionButton) => {
    showConfirmDialog({
      description: t(`confirm.setStateByUser.${button.toState || 'null'}`),
      okCallback: () => {
        handleRequest(groupMembership, button.toState);
        closeModal();
      },
    });
  }, [closeModal, groupMembership, handleRequest, showConfirmDialog, t]);

  return (
    <>
      <IconButton onClick={openModal}>
        <Visibility />
      </IconButton>
      <Modal
        open={open}
        onClose={closeModal}
      >
        <ModalContainer variant="big" close={closeModal} title={groupMembership.trainerName}>
          <div className="vertical">
            <LabelValue label={t('membership.trainerEmail')}>
              { groupMembership.trainerId }
            </LabelValue>
            <LabelValue label={t('membership.groupName')}>
              { groupMembership.group.name }
            </LabelValue>
            <GroupDetails group={groupUi} />
            <LabelValue label={t('membership.state')}>
              {t(`memberState.${groupMembership.membership.state}`)}
            </LabelValue>
            <div className="horizontal">
              {actionButtons.map((button, idx) => (
                <Button key={idx} variant={getButtonVariant(idx)} onClick={() => doAction(button)}>{t(button.label)}</Button>
              ))}
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

export default UserMembershipDetailPopup;