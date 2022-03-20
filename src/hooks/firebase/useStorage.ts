import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const jpegMetadata = {
  contentType: 'image/jpeg',
};

const useStorage = () => {
  const storage = getStorage();

  const uploadAvatar = (file: File | Blob, fileName: string) => {
    const storageRef = ref(storage, `avatars/${fileName}.jpg`);

    return uploadBytes(storageRef, file, jpegMetadata).then((result) => {
      console.log('uploadAvatar Result', result);
    });
  };

  const getAvatarUrl = (fileName: string) => {
    return getDownloadURL(ref(storage, `avatars/${fileName}.jpg`));
  };

  return {
    uploadAvatar,
    getAvatarUrl,
  };
};

export default useStorage;