import { Avatar } from '@mui/material';
import { useUser } from '../../hooks/user';
import { useEffect, useState } from 'react';

const UserAvatar = ({ userId } : { photoUrl?: string, userId: string }) => {
  const { getAvatarUrl } = useUser();
  const [url, setUrl] = useState<string | undefined>();

  useEffect(() => {
    getAvatarUrl(userId).then((u) => setUrl(u), () => {
      //catch error, not set if not exists
    });
  }, [getAvatarUrl, userId]);

  return <Avatar src={url}></Avatar>;
};

export default UserAvatar;