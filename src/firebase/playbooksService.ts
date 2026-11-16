import { 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db, ensureAuthenticatedUser } from './config';
import { Playbook, AnonymizedScorecard } from '../types';
import { DEFAULT_PLAYBOOKS } from '../data/defaultPlaybooks';

const LOCAL_STORAGE_PLAYBOOKS_KEY = 'ghostly_cached_playbooks';
const LOCAL_STORAGE_SCORECARDS_KEY = 'ghostly_cached_scorecards';

export const PlaybooksService = {
  // Fetch Playbooks with automatic Firestore sync & local caching
  async getPlaybooks(): Promise<Playbook[]> {
    try {
      const user = await ensureAuthenticatedUser();
      const playbooksRef = collection(db, 'users', user.uid, 'playbooks');
      const q = query(playbooksRef);
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        // Seed initial default playbooks to user's Firestore collection
        for (const pb of DEFAULT_PLAYBOOKS) {
          await setDoc(doc(playbooksRef, pb.id), pb);
        }
        localStorage.setItem(LOCAL_STORAGE_PLAYBOOKS_KEY, JSON.stringify(DEFAULT_PLAYBOOKS));
        return DEFAULT_PLAYBOOKS;
      }

      const list: Playbook[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as Playbook);
      });

      localStorage.setItem(LOCAL_STORAGE_PLAYBOOKS_KEY, JSON.stringify(list));
      return list;
    } catch (err) {
      console.warn('Firestore offline/fallback, using local cache:', err);
      const cached = localStorage.getItem(LOCAL_STORAGE_PLAYBOOKS_KEY);
      return cached ? JSON.parse(cached) : DEFAULT_PLAYBOOKS;
    }
  },

  // Save or update a Playbook
  async savePlaybook(playbook: Playbook): Promise<void> {
    try {
      const user = await ensureAuthenticatedUser();
      const ref = doc(db, 'users', user.uid, 'playbooks', playbook.id);
      await setDoc(ref, playbook);
    } catch (err) {
      console.warn('Saving to local cache fallback:', err);
    }

    // Update local cache
    const current = await this.getPlaybooks();
    const existingIndex = current.findIndex(p => p.id === playbook.id);
    if (existingIndex >= 0) {
      current[existingIndex] = playbook;
    } else {
      current.push(playbook);
    }
    localStorage.setItem(LOCAL_STORAGE_PLAYBOOKS_KEY, JSON.stringify(current));
  },

  // Delete a Playbook
  async deletePlaybook(id: string): Promise<void> {
    try {
      const user = await ensureAuthenticatedUser();
      await deleteDoc(doc(db, 'users', user.uid, 'playbooks', id));
    } catch (err) {
      console.warn('Delete fallback note:', err);
    }

    const current = (await this.getPlaybooks()).filter(p => p.id !== id);
    localStorage.setItem(LOCAL_STORAGE_PLAYBOOKS_KEY, JSON.stringify(current));
  },

  // Save Anonymized Call Scorecard (0 bytes transcript saved)
  async saveScorecard(scorecard: AnonymizedScorecard): Promise<void> {
    try {
      const user = await ensureAuthenticatedUser();
      const ref = doc(db, 'users', user.uid, 'scorecards', scorecard.id);
      await setDoc(ref, scorecard);
    } catch (err) {
      console.warn('Scorecard local cache fallback:', err);
    }

    // Keep cached in local storage
    const cached = localStorage.getItem(LOCAL_STORAGE_SCORECARDS_KEY);
    const list: AnonymizedScorecard[] = cached ? JSON.parse(cached) : [];
    list.unshift(scorecard);
    localStorage.setItem(LOCAL_STORAGE_SCORECARDS_KEY, JSON.stringify(list.slice(0, 20)));
  },

  // Fetch Anonymized Scorecards History
  async getScorecards(): Promise<AnonymizedScorecard[]> {
    try {
      const user = await ensureAuthenticatedUser();
      const scorecardsRef = collection(db, 'users', user.uid, 'scorecards');
      const q = query(scorecardsRef, orderBy('createdAt', 'desc'));
      const snapshot = await getDocs(q);

      const list: AnonymizedScorecard[] = [];
      snapshot.forEach(docSnap => {
        list.push(docSnap.data() as AnonymizedScorecard);
      });
      return list;
    } catch (err) {
      const cached = localStorage.getItem(LOCAL_STORAGE_SCORECARDS_KEY);
      return cached ? JSON.parse(cached) : [];
    }
  }
};
