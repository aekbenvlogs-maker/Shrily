// services/annoncePersistenceService.ts
// Service de persistence des fiches annonces via IndexedDB + localStorage

export interface AnnonceFiche {
  id: string;
  url: string;
  ville?: string;
  secteur?: string;
  source?: string;
  notes?: string;
  dateModification?: string;
}

const DB_NAME = 'AnnoncesDB';
const DB_VERSION = 1;
const STORE_NAME = 'fiches';
const LOCAL_STORAGE_KEY = 'fiches_annonces_cache';

let db: IDBDatabase | null = null;

/**
 * Initialise la base de données IndexedDB
 */
export async function initDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => {
      console.error('Erreur IndexedDB:', request.error);
      reject(request.error);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;
      
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const objectStore = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
        objectStore.createIndex('url', 'url', { unique: true });
        objectStore.createIndex('ville', 'ville', { unique: false });
        objectStore.createIndex('dateModification', 'dateModification', { unique: false });
      }
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(request.result);
    };
  });
}

/**
 * Sauvegarde une fiche en IndexedDB et en localStorage
 */
export async function saveFiche(fiche: AnnonceFiche): Promise<void> {
  try {
    // S'assurer que la DB est initialisée
    if (!db) {
      await initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = db!.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.put(fiche);

      request.onsuccess = () => {
        // Mettre à jour le cache localStorage
        updateLocalStorageCache();
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.error('Erreur lors de la sauvegarde:', err);
    throw err;
  }
}

/**
 * Récupère toutes les fiches
 */
export async function getAllFiches(): Promise<AnnonceFiche[]> {
  try {
    if (!db) {
      await initDB();
    }

    // Essayer localStorage en premier (plus rapide)
    const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (cached) {
      try {
        return JSON.parse(cached);
      } catch {
        console.warn('Cache localStorage invalide');
      }
    }

    return new Promise((resolve, reject) => {
      const transaction = db!.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.error('Erreur lors de la récupération:', err);
    return [];
  }
}

/**
 * Récupère une fiche par ID
 */
export async function getFiche(id: string): Promise<AnnonceFiche | undefined> {
  try {
    if (!db) {
      await initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = db!.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.get(id);

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.error('Erreur lors de la récupération:', err);
    return undefined;
  }
}

/**
 * Supprime une fiche
 */
export async function deleteFiche(id: string): Promise<void> {
  try {
    if (!db) {
      await initDB();
    }

    return new Promise((resolve, reject) => {
      const transaction = db!.transaction([STORE_NAME], 'readwrite');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.delete(id);

      request.onsuccess = () => {
        updateLocalStorageCache();
        resolve();
      };

      request.onerror = () => {
        reject(request.error);
      };
    });
  } catch (err) {
    console.error('Erreur lors de la suppression:', err);
    throw err;
  }
}

/**
 * Mise à jour du cache localStorage
 */
async function updateLocalStorageCache(): Promise<void> {
  try {
    if (!db) {
      await initDB();
    }

    const allFiches = await new Promise<AnnonceFiche[]>((resolve, reject) => {
      const transaction = db!.transaction([STORE_NAME], 'readonly');
      const objectStore = transaction.objectStore(STORE_NAME);
      const request = objectStore.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });

    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(allFiches));
  } catch (err) {
    console.warn('Impossible de mettre à jour le cache:', err);
  }
}

/**
 * Initialise le service
 */
export async function initialize(): Promise<void> {
  try {
    await initDB();
    await updateLocalStorageCache();
    console.log('Service de persistence initialisé');
  } catch (err) {
    console.error('Erreur lors de l\'initialisation:', err);
  }
}

// Auto-initialiser au chargement
if (typeof window !== 'undefined') {
  initialize().catch(console.error);
}

export default {
  initDB,
  saveFiche,
  getAllFiches,
  getFiche,
  deleteFiche,
  initialize
};
