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

export const removeStr = (items: string[], value: string) => {
  const idx = items.indexOf(value);
  if (idx >= 0) {
    items.splice(idx, 1);
  }
  return items;
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
  if (idx >= 0) {
    changed[idx] = newItem;
  } else {
    changed.push(newItem);
  }
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

export const deleteObject = (firestore: Firestore, path: string, id: string) => {
  const docRef = doc(firestore, path, id);
  return deleteDoc(docRef);
};

export const updateObject = <T extends { id: string }>(firestore: Firestore, path: string, object: T, merge = true) => {
  const docRef = doc(firestore, path, object.id);
  const updated = { ...object };
  // @ts-ignore
  delete updated.id;
  return setDoc(docRef, updated, { merge });
};

export const getCollectionRef = (firestore: Firestore, path: string, dateProperties?: string[]) => collection(firestore, path)
  .withConverter(dateProperties ? createDatePropertiesWithConverter(dateProperties) : idConverter);

export const doQuery = (firestore: Firestore, path: string, dateProperties?: string[], ...queryConstraints: QueryConstraint[]) => {
  return getDocs(query(getCollectionRef(firestore, path, dateProperties), ...queryConstraints))
    .then((querySnapshot) => querySnapshot.docs.map((document) => document.data()));
};

export const insertObject = (firestore: Firestore, path: string, object: any) => {
  const collectionRef = getCollectionRef(firestore, path);
  return addDoc(collectionRef, object).then((docRef) => {
    object.id = docRef.id;
    return object;
  });
};

export const cloneObject = (firestore: Firestore, fromPath: string, toPath: string, id: string) => {
  loadObject(firestore, fromPath, id).then((data) => {
    if (!data) {
      throw new Error('Data not found to id ' + fromPath + '/' + id);
    }
    updateObject(firestore, toPath, data).then(() => {
      console.log('Object moved', data);
    });
  });  
};

export const cloneCollection = (firestore: Firestore, fromPath: string, toPath: string, transform?: (data: any) => any) => {
  const fromRef = getCollectionRef(firestore, fromPath);
  getDocs(fromRef).then((querySnapshot) => {
    querySnapshot.docs.forEach((document) => {
      const data = document.data();
      const transformed = transform ? transform(data) : data;
      updateObject(firestore, toPath, transformed).then(() => {
        console.log('Object moved from collection', document.data(), false);
      });
    });
  });
};

export const useFirestore = <T extends { id: string }>(path: string, dateProperties?: string[]) => {
  const { firestore } = useFirebase();
  const { showBackdrop, hideBackdrop } = useDialog();
  
  const collectionRef = useMemo(() => getCollectionRef(firestore, path, dateProperties), [dateProperties, firestore, path]);

  const getDocRef = useCallback((id: string) => doc(collectionRef, id), [collectionRef]);

  const hiddeError = useCallback((err: any, messageKey?: string) => {
    hideBackdrop(messageKey);
    throw err;
  }, [hideBackdrop]);

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
      }, (err) => hiddeError(err, useMessage ? 'error.update' : undefined));
    }
  }, [collectionRef, getDocRef, hiddeError, hideBackdrop, showBackdrop]);

  const getAndModify: (id: string, modifier: (item: T) => T, checkExistence?: boolean, useMessage?: boolean) => Promise<T> =
    useCallback((id: string, modifier: (item: T) => T, checkExistence, useMessage = true) => {
      showBackdrop();
      const docRef = getDocRef(id);
      return new Promise((resolve, reject) => {
        getDoc(docRef).then((querySnapshot) => {
          const inDb = querySnapshot.data();
          if (checkExistence && !inDb) {
            hideBackdrop();
            reject(`Not found data in database to ${path}/${id}`);
            return;
          }
          const modified = modifier(inDb);
          setDoc(docRef, modified).then(() => {
            hideBackdrop(useMessage ? 'common.modifySuccess' : '');
            resolve(modified);
          }, (err) => hiddeError(err, useMessage ? 'error.update' : undefined));
        });
      });
    }, [getDocRef, hiddeError, hideBackdrop, path, showBackdrop]);

  const remove = useCallback((id: string, useMessage = true) => {
    showBackdrop();
    return deleteDoc(getDocRef(id)).then(
      () => hideBackdrop(useMessage && 'common.removeSuccess'),
      (err) => hiddeError(err, useMessage ? 'error.update' : undefined));
  }, [getDocRef, hiddeError, hideBackdrop, showBackdrop]);

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
