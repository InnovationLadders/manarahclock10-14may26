import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, listAll, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import { clearLocalCache } from './mosqueUtils';

export interface MosqueDetailsUpdate {
  mosqueName: string;
  madhab: string;
  city: string;
  latitude: number;
  longitude: number;
}

export const updateMosqueDetails = async (mosqueId: string, update: MosqueDetailsUpdate): Promise<void> => {
  await updateDoc(doc(db, 'mosques', mosqueId), {
    mosqueName: update.mosqueName,
    madhab: update.madhab,
    'location.city': update.city,
    'location.latitude': update.latitude,
    'location.longitude': update.longitude
  });
  clearLocalCache();
};

export const setMosqueHidden = async (mosqueId: string, hidden: boolean): Promise<void> => {
  await updateDoc(doc(db, 'mosques', mosqueId), { hidden });
  clearLocalCache();
};

const deleteBackgroundFiles = async (mosqueId: string): Promise<void> => {
  const listing = await listAll(ref(storage, `backgrounds/${mosqueId}`));
  await Promise.all(listing.items.map((item) => deleteObject(item)));
};

export const deleteMosque = async (mosqueId: string): Promise<void> => {
  await deleteBackgroundFiles(mosqueId);
  await deleteDoc(doc(db, 'mosques', mosqueId));
  clearLocalCache();
};
