import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useCallback, useMemo } from 'react';

const jpegMetadata = {
  contentType: 'image/jpeg',
};

const useStorage = () => {
  const storage = useMemo(() => getStorage(), []);

  const uploadAvatar = useCallback((file: File | Blob, fileName: string) => {
    const storageRef = ref(storage, `avatars/${fileName}.jpg`);

    return uploadBytes(storageRef, file, jpegMetadata).then((result) => {
      console.log('uploadAvatar Result', result);
    });
  }, [storage]);

  const getAvatarUrl = useCallback((fileName: string) => {
    return getDownloadURL(ref(storage, `avatars/${fileName}.jpg`));
  }, [storage]);

  return {
    uploadAvatar,
    getAvatarUrl,
  };
};

export default useStorage;