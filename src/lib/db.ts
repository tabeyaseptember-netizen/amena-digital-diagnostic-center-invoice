// IndexedDB for offline-first data storage
const DB_NAME = 'AmenaDiagnosticDB';
const DB_VERSION = 1;

export interface Test {
  id: string;
  name: string;
  price: number;
  category?: string;
}

export interface Patient {
  id: string;
  serial: number;
  name: string;
  phone: string;
  age?: number;
  gender?: string;
  tests: Test[];
  discount: number;
  total: number;
  finalAmount: number;
  date: string;
}

let db: IDBDatabase | null = null;

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains('patients')) {
        const patientStore = db.createObjectStore('patients', { keyPath: 'id' });
        patientStore.createIndex('serial', 'serial', { unique: true });
        patientStore.createIndex('date', 'date', { unique: false });
      }

      if (!db.objectStoreNames.contains('tests')) {
        const testStore = db.createObjectStore('tests', { keyPath: 'id' });
        testStore.createIndex('name', 'name', { unique: false });
      }
    };
  });
};

const getDB = async (): Promise<IDBDatabase> => {
  if (!db) {
    db = await initDB();
  }
  return db;
};

// Patient operations
export const addPatient = async (patient: Patient): Promise<void> => {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['patients'], 'readwrite');
    const store = transaction.objectStore('patients');
    const request = store.add(patient);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getPatients = async (): Promise<Patient[]> => {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['patients'], 'readonly');
    const store = transaction.objectStore('patients');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const updatePatient = async (patient: Patient): Promise<void> => {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['patients'], 'readwrite');
    const store = transaction.objectStore('patients');
    const request = store.put(patient);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const deletePatient = async (id: string): Promise<void> => {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['patients'], 'readwrite');
    const store = transaction.objectStore('patients');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getNextSerial = async (): Promise<number> => {
  const patients = await getPatients();
  if (patients.length === 0) return 1001;
  return Math.max(...patients.map(p => p.serial)) + 1;
};

// Test operations
export const addTest = async (test: Test): Promise<void> => {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['tests'], 'readwrite');
    const store = transaction.objectStore('tests');
    const request = store.add(test);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const getTests = async (): Promise<Test[]> => {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['tests'], 'readonly');
    const store = transaction.objectStore('tests');
    const request = store.getAll();

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

export const updateTest = async (test: Test): Promise<void> => {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['tests'], 'readwrite');
    const store = transaction.objectStore('tests');
    const request = store.put(test);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

export const deleteTest = async (id: string): Promise<void> => {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['tests'], 'readwrite');
    const store = transaction.objectStore('tests');
    const request = store.delete(id);

    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Initialize default tests
export const initDefaultTests = async (): Promise<void> => {
  const tests = await getTests();
  if (tests.length > 0) return;

  const defaultTests: Test[] = [
    { id: crypto.randomUUID(), name: 'Complete Blood Count (CBC)', price: 500, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'Blood Sugar (Fasting)', price: 200, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'Blood Sugar (Random)', price: 150, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'Lipid Profile', price: 800, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'Liver Function Test (LFT)', price: 1000, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'Kidney Function Test (KFT)', price: 900, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'Thyroid Profile (T3, T4, TSH)', price: 1200, category: 'Hormone Test' },
    { id: crypto.randomUUID(), name: 'HbA1c', price: 600, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'Urine Routine', price: 300, category: 'Urine Test' },
    { id: crypto.randomUUID(), name: 'X-Ray Chest', price: 700, category: 'Radiology' },
    { id: crypto.randomUUID(), name: 'Ultrasound (Whole Abdomen)', price: 1500, category: 'Radiology' },
    { id: crypto.randomUUID(), name: 'ECG', price: 400, category: 'Cardiology' },
  ];

  for (const test of defaultTests) {
    await addTest(test);
  }
};
