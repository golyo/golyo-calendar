import { useFirebase } from '../firebase/FirebaseProvider';
import { useCallback, useMemo } from 'react';
import {
  deleteDoc,
  doc,
  setDoc,
  addDoc,
  getDoc,
  collection,
  getDocs,
  query,
  SnapshotOptions,
  QueryDocumentSnapshot,
  DocumentData,
  Firestore,
  FirestoreDataConverter,
  QueryConstraint,
} from 'firebase/firestore';
import { useDialog } from '../dialog';

const idConverter: FirestoreDataConverter<any> = {
  toFirestore: (object: any) => {
    const toDb = { ...object };
    delete toDb.id;
    return toDb;
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot<DocumentData>, options: SnapshotOptions) => {
    const data = snapshot.data(options);
    return {
      ...data,
      id: snapshot.id,
    };
  },
};

export const removeItemByCheck : <T> (items: T[], check: (item: T) => boolean) => T[] = (items, check) => {
  const cutted = [...items];
  const idx = cutted.findIndex((item) => check(item));
  if (idx >= 0) {
    cutted.splice(idx, 1);
  }
  return cutted;
};

export const removeItemByEqual : <T> (items: T[], item: T, isEqual: (a: T, b: T) => boolean) => T[] = (items, item, isEqual) =>
  removeItemByCheck(items, (find) => isEqual(find, item));

export const removeItemById : <T extends { id: string }> (items: T[], id: string) => T[] = (items, id) =>
  removeItemByCheck(items, (item) => item.id === id);

export const changeItemByEqual :<T> (items: T[], newItem: T, isEqual: (a: T, b: T) => boolean) => T[] = (items, newItem, isEqual) => {
  const changed = [...items];
  const idx = changed.findIndex((item) => isEqual(item, newItem));
  changed[idx] = newItem;
  return changed;
};

export const changeItem : <T extends { id: string }> (items: T[], newItem: T) => T[] = (items, newItem) =>
  changeItemByEqual(items, newItem, (a, b) => a.id === b.id);

export const createDatePropertiesWithConverter = (properties: string[]) => ({
  toFirestore: (object: any) => {
    const newobj = idConverter.toFirestore(object);
    properties.forEach((prop) => {
      if (newobj[prop]) {
        newobj[prop] = (newobj[prop] as Date).getTime();
      }
    });
    return newobj;
  },
  fromFirestore: (snapshot: QueryDocumentSnapshot<DocumentData>, options: SnapshotOptions) => {
    const object = idConverter.fromFirestore(snapshot, options);
    properties.forEach((prop) => {
      if (object[prop]) {
        object[prop] = new Date(object[prop]);
      }
    });
    return object;
  },
});

export const loadObject = (firestore: Firestore, path: string, id: string) => {
  const docRef = doc(firestore, path, id);
  return getDoc(docRef).then((document) => {
    return document  ? {
      id: id,
      ...document.data(),
    } : undefined;
  });
};

export const insertObject = <T extends { id: string }>(firestore: Firestore, path: string, object: T) => {
  const collectionRef = collection(firestore, path);
  return addDoc(collectionRef, object).then((docRef) => {
    object.id = docRef.id;
    return object;
  });
};

export const deleteObject = (firestore: Firestore, path: string, id: string) => {
  const docRef = doc(firestore, path, id);
  return deleteDoc(docRef);
};

export const updateObject = <T extends { id: string }>(firestore: Firestore, path: string, object: T, merge = true) => {
  const docRef = doc(firestore, path, object.id);
  return setDoc(docRef, object, { merge });
};

export const getCollectionRef = (firestore: Firestore, path: string, dateProperties?: string[]) => collection(firestore, path)
  .withConverter(dateProperties ? createDatePropertiesWithConverter(dateProperties) : idConverter);

export const doQuery = (firestore: Firestore, path: string, dateProperties: string[], ...queryConstraints: QueryConstraint[]) => {
  return getDocs(query(getCollectionRef(firestore, path, dateProperties), ...queryConstraints))
    .then((querySnapshot) => querySnapshot.docs.map((document) => document.data()));
};

export const useFirestore = <T extends { id: string }>(path: string, dateProperties?: string[]) => {
  const { firestore } = useFirebase();
  const { showBackdrop, hideBackdrop } = useDialog();
  
  const collectionRef = useMemo(() => getCollectionRef(firestore, path, dateProperties), [dateProperties, firestore, path]);

  const getDocRef = useCallback((id: string) => doc(collectionRef, id), [collectionRef]);

  const save = useCallback((data: any, merge = true, useMessage = true) => {
    showBackdrop();
    if (data.id) {
      const docRef = getDocRef(data.id);
      return setDoc(docRef, data, { merge }).then(() => {
        hideBackdrop(useMessage && 'common.modifySuccess');
        return docRef;
      });
    } else {
      return addDoc(collectionRef, data).then((docRef) => {
        data.id = docRef.id;
        hideBackdrop(useMessage && 'common.insertSuccess');
        return docRef;
      });
    }
  }, [collectionRef, getDocRef, hideBackdrop, showBackdrop]);

  const getAndModify: (id: string, modifier: (item: T) => T, useMessage?: boolean) => Promise<T> =
    useCallback((id: string, modifier: (item: T) => T, useMessage = true) => {
      showBackdrop();
      const docRef = getDocRef(id);
      return new Promise((resolve) => {
        getDoc(docRef).then((querySnapshot) => {
          const modified = modifier(querySnapshot.data());
          setDoc(docRef, modified).then(() => {
            hideBackdrop(useMessage ? 'common.modifySuccess' : '');
            resolve(modified);
          });
        });
      });
    }, [getDocRef, hideBackdrop, showBackdrop]);

  const remove = useCallback((id: string, useMessage = true) => {
    showBackdrop();
    return deleteDoc(getDocRef(id)).then(() => hideBackdrop(useMessage && 'common.removeSuccess'));
  }, [getDocRef, hideBackdrop, showBackdrop]);

  const listAll = useCallback((...queryConstraints: QueryConstraint[]) => {
    showBackdrop();
    return getDocs(query(collectionRef, ...queryConstraints)).then((querySnapshot) => {
      const result = querySnapshot.docs.map((document) => document.data() as T);
      hideBackdrop();
      return result;
    });
  }, [collectionRef, hideBackdrop, showBackdrop]);

  const get = useCallback((id: string) => {
    showBackdrop();
    return getDoc(getDocRef(id)).then((document) => {
      hideBackdrop();
      return document.data() as T;
    });
  }, [getDocRef, hideBackdrop, showBackdrop]);

  return useMemo(() => ({
    get,
    getAndModify,
    listAll,
    remove,
    save,
  }), [get, getAndModify, listAll, remove, save]);
};