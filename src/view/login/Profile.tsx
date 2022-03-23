import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button, MenuItem, Paper, Select, Typography } from '@mui/material';
import { useUser } from '../../hooks/user';
import { useAuth } from '../../hooks/auth';
import FlagIcon from '../../menu/FlagIcon';
import LabelValue from '../common/LabelValue';
import TrainerBaseData from '../trainer/TrainerBaseData';
import ProfilePopup from './ProfilePopup';
import useStorage from '../../hooks/firebase/useStorage';
import UserAvatar from '../common/UserAvatar';
import { useDialog } from '../../hooks/dialog';

const MAX_AVATAR_SIZE = 100000;

const Profile = () => {
  const { t, i18n } = useTranslation();
  const { isPasswordEnabled } = useAuth();
  const { user, saveUser, userChanged } = useUser();
  const { showDialog } = useDialog();

  const { uploadAvatar } = useStorage();

  const [language, setLanguage] = React.useState(i18n.language);

  const handleChangeLanguage = useCallback((event) => {
    const newLanguage = event.target.value;
    setLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
  }, [i18n]);

  const trainerRegistration = useCallback(() => {
    if (!user) {
      return;
    }
    const toSave = { ...user, registeredAsTrainer: true };
    return saveUser(toSave);
  }, [saveUser, user]);

  const selectFile = useCallback((e) => {
    const selectedFile = e.target.files?.length > 0 ? e.target.files[0] : undefined;
    if (!selectedFile) {
      return;
    }
    if (selectedFile.size >= MAX_AVATAR_SIZE) {
      showDialog({
        title: 'common.warning',
        description: 'warning.maxAvatarSize',
      });
      return;
    }
    uploadAvatar(selectedFile, user!.id).then(() => {
      userChanged();
    });
  }, [showDialog, uploadAvatar, user, userChanged]);

  if (!user) {
    return <div></div>;
  }

  return (
    <div className="vertical">
      <LabelValue label={t('common.language')}>
        <Select
          value={language}
          onChange={handleChangeLanguage}
          variant="standard"
        >
          <MenuItem value="hu">
            <FlagIcon code="hu" />&nbsp;&nbsp;magyar
          </MenuItem>
          <MenuItem value="en">
            <FlagIcon code="gb" />&nbsp;&nbsp;english
          </MenuItem>
        </Select>
      </LabelValue>
      <Typography variant="h3">{t('login.profile')}</Typography>
      <LabelValue label={t('login.email')}>{user.id}</LabelValue>
      <LabelValue label={t('login.userName')}>{user.name}</LabelValue>
      <LabelValue label={t('login.photoURL')}>
        <div className="horizontal">
          <UserAvatar userId={user.id}/>
          <Button variant="contained" component="label">
            {t('login.newAvatar')}
            <input
              type="file"
              accept="image/jpeg"
              onChange={selectFile}
              hidden
            />
          </Button>
        </div>
      </LabelValue>
      <div>
        <ProfilePopup />
        { isPasswordEnabled() && <Link to="changePassword">{t('login.changePassword')}</Link> }
      </div>
      <div>&nbsp;</div>
      <Paper>
        {!user.isTrainer && <div>
          {!user.registeredAsTrainer && <div className="vertical">
            <div>{t('trainer.registrationInfo')}</div>
            <div>
              <Button color="primary" variant="contained" onClick={trainerRegistration} disabled={!user.location}>
                {t('common.register')}
              </Button>
            </div>
          </div>}
          {user.registeredAsTrainer && <div>
            {t('trainer.waitingApprovalText')}
          </div>}
        </div>}
        {user.isTrainer && <div>
          {t('trainer.approvedText')}
        </div>}
      </Paper>
      {user.isTrainer && <div><TrainerBaseData /></div>}

    </div>
  );
};

export default Profile;
