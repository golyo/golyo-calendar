import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { Button } from '@mui/material';
import { Delete, Edit } from '@mui/icons-material';

import { useDialog } from '../../../hooks/dialog';
import { useGroup, useTrainer } from '../../../hooks/trainer';
import EditGroupPopup from './EditGroupPopup';
import GroupDetails from './GroupDetails';
import LabelValue from '../../common/LabelValue';

export default function DisplayGroup() {
  const { t } = useTranslation();
  const { showConfirmDialog, showDialog } = useDialog();
  const navigate = useNavigate();
  const { attachedGroups, group } = useGroup();
  const { members, saveGroup, deleteGroup } = useTrainer();

  const [edit, setEdit] = useState<boolean>(false);

  const closePopup = useCallback(() => setEdit(false), []);
  const openPopup = useCallback(() => setEdit(true), []);

  const doDelete = useCallback(() => {
    if (members.length > 0) {
      showDialog({
        title: 'common.warning',
        description: 'warning.deleteGroup',
      });
      return;
    }
    showConfirmDialog({
      description: 'trainingGroup.deleteConfirm',
      okCallback: () => {
        navigate('/groups');
        deleteGroup(group!.id);
      },
    });
  }, [deleteGroup, group, members.length, navigate, showConfirmDialog, showDialog]);

  if (!group) {
    return null;
  }

  return (
    <>
      <GroupDetails group={group} />
      <LabelValue label={t('trainingGroup.attachedGroups')}>
        {attachedGroups.map((agroup, idx) => (
          <div key={idx}>{agroup.name}</div>
        ))}
      </LabelValue>
      <div className="horizontal">
        <Button onClick={openPopup} variant="contained" startIcon={<Edit />}>{t('common.modify')}</Button>
        <Button onClick={doDelete} variant="contained" startIcon={<Delete />}>{t('common.delete')}</Button>
      </div>

      <EditGroupPopup trainingGroup={group} closePopup={closePopup} isOpen={edit} saveGroup={saveGroup} />
    </>
  );
}