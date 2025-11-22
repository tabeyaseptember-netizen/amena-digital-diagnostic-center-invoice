// IndexedDB for offline-first data storage with strict persistence
const DB_NAME = 'amena_diagno_db';
const DB_VERSION = 2; // Incremented for new stores

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
  address?: string;
  tests: Test[];
  discount: number;
  total: number;
  finalAmount: number;
  date: string;
  // Optional fields for receipt QR functionality
  receiptId?: string;
  receiptHash?: string;
}

export interface Backup {
  id: string;
  timestamp: string;
  data: {
    patients: Patient[];
    tests: Test[];
  };
}

export interface PendingWrite {
  id: string;
  store: 'patients' | 'tests';
  operation: 'add' | 'update' | 'delete';
  data: any;
  timestamp: string;
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
      const oldVersion = event.oldVersion;

      // NEVER delete existing stores - only create new ones or migrate
      if (!db.objectStoreNames.contains('patients')) {
        const patientStore = db.createObjectStore('patients', { keyPath: 'id' });
        patientStore.createIndex('serial', 'serial', { unique: true });
        patientStore.createIndex('date', 'date', { unique: false });
      }

      if (!db.objectStoreNames.contains('tests')) {
        const testStore = db.createObjectStore('tests', { keyPath: 'id' });
        testStore.createIndex('name', 'name', { unique: false });
      }

      // Add backup store (v2)
      if (!db.objectStoreNames.contains('backups')) {
        const backupStore = db.createObjectStore('backups', { keyPath: 'id' });
        backupStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Add pending writes store for WAL (v2)
      if (!db.objectStoreNames.contains('pending_writes')) {
        const pendingStore = db.createObjectStore('pending_writes', { keyPath: 'id' });
        pendingStore.createIndex('timestamp', 'timestamp', { unique: false });
      }

      // Migration from v1 to v2 - preserve all data
      if (oldVersion < 2) {
        console.log('Migrating database from v' + oldVersion + ' to v2 - preserving all data');
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

// BroadcastChannel for multi-tab sync
const syncChannel = new BroadcastChannel('amena_sync');

// Patient operations with WAL
export const addPatient = async (patient: Patient): Promise<void> => {
  const database = await getDB();
  
  // Ensure receiptId and compute receiptHash (SHA-256 of canonical receipt payload)
  if (!patient.receiptId) patient.receiptId = crypto.randomUUID();
  try {
    const receiptPayload = JSON.stringify({
      serial: patient.serial,
      name: patient.name,
      phone: patient.phone,
      tests: patient.tests,
      total: patient.total,
      finalAmount: patient.finalAmount,
      date: patient.date
    });
    const encoder = new TextEncoder();
    const digest = await crypto.subtle.digest('SHA-256', encoder.encode(receiptPayload));
    patient.receiptHash = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    console.warn('Failed to compute receipt hash', e);
    patient.receiptHash = undefined;
  }

  // Step 1: Write to pending_writes (WAL)
  const pendingWrite: PendingWrite = {
    id: crypto.randomUUID(),
    store: 'patients',
    operation: 'add',
    data: patient,
    timestamp: new Date().toISOString()
  };
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['patients', 'pending_writes'], 'readwrite');
    const pendingStore = transaction.objectStore('pending_writes');
    const patientStore = transaction.objectStore('patients');
    
    // First write to WAL
    const pendingRequest = pendingStore.add(pendingWrite);
    
    pendingRequest.onsuccess = () => {
      // Then write to main store
      const mainRequest = patientStore.add(patient);
      
      mainRequest.onsuccess = () => {
        // Clean up pending write
        pendingStore.delete(pendingWrite.id);
        // Notify other tabs
        syncChannel.postMessage({ type: 'patient_added', data: patient });
        resolve();
      };
      
      mainRequest.onerror = () => reject(mainRequest.error);
    };
    
    pendingRequest.onerror = () => reject(pendingRequest.error);
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

  // Ensure receiptId exists and recompute receiptHash on update
  if (!patient.receiptId) patient.receiptId = crypto.randomUUID();
  try {
    const receiptPayload = JSON.stringify({
      serial: patient.serial,
      name: patient.name,
      phone: patient.phone,
      tests: patient.tests,
      total: patient.total,
      finalAmount: patient.finalAmount,
      date: patient.date
    });
    const encoder = new TextEncoder();
    const digest = await crypto.subtle.digest('SHA-256', encoder.encode(receiptPayload));
    patient.receiptHash = Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (e) {
    console.warn('Failed to compute receipt hash on update', e);
    patient.receiptHash = undefined;
  }

  const pendingWrite: PendingWrite = {
    id: crypto.randomUUID(),
    store: 'patients',
    operation: 'update',
    data: patient,
    timestamp: new Date().toISOString()
  };
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['patients', 'pending_writes'], 'readwrite');
    const pendingStore = transaction.objectStore('pending_writes');
    const patientStore = transaction.objectStore('patients');
    
    const pendingRequest = pendingStore.add(pendingWrite);
    
    pendingRequest.onsuccess = () => {
      const mainRequest = patientStore.put(patient);
      
      mainRequest.onsuccess = () => {
        pendingStore.delete(pendingWrite.id);
        syncChannel.postMessage({ type: 'patient_updated', data: patient });
        resolve();
      };
      
      mainRequest.onerror = () => reject(mainRequest.error);
    };
    
    pendingRequest.onerror = () => reject(pendingRequest.error);
  });
};

export const deletePatient = async (id: string): Promise<void> => {
  const database = await getDB();
  
  const pendingWrite: PendingWrite = {
    id: crypto.randomUUID(),
    store: 'patients',
    operation: 'delete',
    data: { id },
    timestamp: new Date().toISOString()
  };
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['patients', 'pending_writes'], 'readwrite');
    const pendingStore = transaction.objectStore('pending_writes');
    const patientStore = transaction.objectStore('patients');
    
    const pendingRequest = pendingStore.add(pendingWrite);
    
    pendingRequest.onsuccess = () => {
      const mainRequest = patientStore.delete(id);
      
      mainRequest.onsuccess = () => {
        pendingStore.delete(pendingWrite.id);
        syncChannel.postMessage({ type: 'patient_deleted', data: { id } });
        resolve();
      };
      
      mainRequest.onerror = () => reject(mainRequest.error);
    };
    
    pendingRequest.onerror = () => reject(pendingRequest.error);
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
  // Clear all existing tests first
  const existingTests = await getTests();
  for (const test of existingTests) {
    await deleteTest(test.id);
  }

  const defaultTests: Test[] = [
    // Blood Tests and General Tests (Serial Order)
    { id: crypto.randomUUID(), name: 'CBC, ESR', price: 400, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'Urine RIE', price: 150, category: 'Urine Test' },
    { id: crypto.randomUUID(), name: 'RBS', price: 150, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'Blood grouping and Rh factor', price: 100, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'ECG', price: 400, category: 'Cardiology' },
    { id: crypto.randomUUID(), name: 'USG of W/A', price: 700, category: 'Radiology' },
    { id: crypto.randomUUID(), name: 'S. Creatinine', price: 400, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'Widal test', price: 400, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'FBS', price: 150, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: '2hABF', price: 150, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'SGPT(ALT)', price: 500, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'SGOT (AST)', price: 500, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'TSH', price: 1000, category: 'Hormone Test' },
    { id: crypto.randomUUID(), name: 'FT3', price: 1000, category: 'Hormone Test' },
    { id: crypto.randomUUID(), name: 'FT4', price: 1000, category: 'Hormone Test' },
    { id: crypto.randomUUID(), name: 'T3', price: 1000, category: 'Hormone Test' },
    { id: crypto.randomUUID(), name: 'T4', price: 1000, category: 'Hormone Test' },
    { id: crypto.randomUUID(), name: 'LH', price: 1000, category: 'Hormone Test' },
    { id: crypto.randomUUID(), name: 'FSH', price: 1000, category: 'Hormone Test' },
    { id: crypto.randomUUID(), name: 'IgE', price: 1500, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'Prolactin', price: 1000, category: 'Hormone Test' },
    { id: crypto.randomUUID(), name: 'Testosterone', price: 1000, category: 'Hormone Test' },
    { id: crypto.randomUUID(), name: 'Lipid profile', price: 1000, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'S. Electrolyte', price: 1000, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'Cholesterol', price: 400, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'TG (triglyceride)', price: 400, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'HBsAg', price: 300, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'Anti-HCV', price: 400, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'CRP', price: 800, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'H pylori', price: 700, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'RA test', price: 300, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'Semen Analysis', price: 500, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'PSA', price: 1500, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'Troponin-I', price: 1000, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'CK-MB', price: 1000, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'S.bilirubin', price: 300, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'S. uric acid', price: 400, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'S.Calcium', price: 600, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'HbA1C', price: 1000, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'Pregnancy test', price: 150, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'NS1', price: 600, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'IgG/IgM for Dengue', price: 600, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'TC', price: 300, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'DC', price: 300, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'Hb%', price: 300, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'ESR', price: 300, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'BT, CT', price: 200, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'Platelet count', price: 300, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'ASO titre', price: 400, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'Alkaline phosphatase', price: 600, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'Liver Function test(bilirubin, Supt, SGOT, Alkaline phosphatase)', price: 1900, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'HIV', price: 600, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'VDRL', price: 300, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'TPHA', price: 300, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'Beta-HCG', price: 1000, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'TC, DC, Hb%, ESR', price: 300, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'S. Amylase', price: 800, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'MP', price: 200, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'C. E count', price: 200, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'RBC count', price: 200, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'OGTT, CUS', price: 500, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'Aldehyde Test (AT)', price: 300, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'Urea Level', price: 300, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'ICT for Kalazar', price: 500, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'ICT for TB', price: 600, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'ICT for Filaria', price: 800, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'ITC for chikungunya', price: 800, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'D-Dimer', price: 1500, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'Ferritin', price: 1200, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'ICT for Dope test', price: 1000, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'Sputum for AFB', price: 200, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'MT test', price: 300, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'Stool R/E', price: 300, category: 'Urine Test' },
    { id: crypto.randomUUID(), name: 'Occult Blood test (OBT)', price: 400, category: 'Blood Test' },
    { id: crypto.randomUUID(), name: 'Reducing substances (RS)', price: 400, category: 'Blood Test' },
    // USG and Radiology Tests
    { id: crypto.randomUUID(), name: 'USG of Lower Abdomen', price: 600, category: 'Radiology' },
    { id: crypto.randomUUID(), name: 'USG of pregnancy profile', price: 600, category: 'Radiology' },
    { id: crypto.randomUUID(), name: 'USG of HBS', price: 600, category: 'Radiology' },
    { id: crypto.randomUUID(), name: 'USG of thyroid', price: 600, category: 'Radiology' },
    { id: crypto.randomUUID(), name: 'USG of brest (single)', price: 600, category: 'Radiology' },
    { id: crypto.randomUUID(), name: 'USG of brest (both)', price: 800, category: 'Radiology' },
    { id: crypto.randomUUID(), name: 'USG of scrotum', price: 600, category: 'Radiology' },
    { id: crypto.randomUUID(), name: 'USG of pelvic organ (Lower Abdomen)', price: 600, category: 'Radiology' },
    { id: crypto.randomUUID(), name: 'CXR P/A view', price: 400, category: 'Radiology' },
    { id: crypto.randomUUID(), name: 'X-Ray of chest P/A view', price: 400, category: 'Radiology' },
    { id: crypto.randomUUID(), name: 'CXR A/P view', price: 400, category: 'Radiology' },
    { id: crypto.randomUUID(), name: 'x-ray of chest A/p view', price: 400, category: 'Radiology' },
    { id: crypto.randomUUID(), name: 'OPG', price: 400, category: 'Radiology' },
    { id: crypto.randomUUID(), name: 'Dental 1 Film', price: 150, category: 'Radiology' },
    { id: crypto.randomUUID(), name: 'plain Xray Abdomen A/p view', price: 400, category: 'Radiology' },
    { id: crypto.randomUUID(), name: 'X-ray Skull B/V', price: 600, category: 'Radiology' },
    { id: crypto.randomUUID(), name: 'X-ray of C/S(cervical spine) B/V', price: 700, category: 'Radiology' },
    { id: crypto.randomUUID(), name: 'X-ray of C/S (cervical spine) L/V', price: 400, category: 'Radiology' },
    { id: crypto.randomUUID(), name: 'X-ray of Lumbosacral spine (L/S), B/V', price: 700, category: 'Radiology' },
    { id: crypto.randomUUID(), name: 'X-ray of L/S (Lumbosacral spine) L/V', price: 400, category: 'Radiology' },
    { id: crypto.randomUUID(), name: 'X-ray of PNS', price: 400, category: 'Radiology' },
    { id: crypto.randomUUID(), name: 'X-ray of KUB', price: 400, category: 'Radiology' },
    { id: crypto.randomUUID(), name: 'X-ray of knee joint (RT) B/V', price: 400, category: 'Radiology' },
    { id: crypto.randomUUID(), name: 'X-ray of knee joint (LT) B/V', price: 400, category: 'Radiology' },
    { id: crypto.randomUUID(), name: 'X-ray of shoulder joint (RT), B/V', price: 400, category: 'Radiology' },
    { id: crypto.randomUUID(), name: 'X-ray of shoulder Joint (LT) B/V', price: 400, category: 'Radiology' },
    { id: crypto.randomUUID(), name: 'X-ray of hip Joint (Rt)', price: 400, category: 'Radiology' },
    { id: crypto.randomUUID(), name: 'X-ray of hip Joint (LT)', price: 400, category: 'Radiology' },
    { id: crypto.randomUUID(), name: 'X-ray of pelvis (RT)', price: 400, category: 'Radiology' },
    { id: crypto.randomUUID(), name: 'X-ray of pelvis (LT)', price: 400, category: 'Radiology' },
    { id: crypto.randomUUID(), name: 'X-ray of arm (LT)', price: 400, category: 'Radiology' },
    { id: crypto.randomUUID(), name: 'X-ray of arm (RT)', price: 400, category: 'Radiology' },
    { id: crypto.randomUUID(), name: 'X-ray of elbo joint (LT)', price: 400, category: 'Radiology' },
    { id: crypto.randomUUID(), name: 'X-ray of elbo joint (RT)', price: 400, category: 'Radiology' },
    { id: crypto.randomUUID(), name: 'X-ray of fore arm (LT)', price: 400, category: 'Radiology' },
    { id: crypto.randomUUID(), name: 'X-ray of fore arm (RT)', price: 400, category: 'Radiology' },
    { id: crypto.randomUUID(), name: 'X-ray of fore arm including wrist joint (LT)', price: 400, category: 'Radiology' },
    { id: crypto.randomUUID(), name: 'X-ray of fore arm including wrist joint (RT)', price: 400, category: 'Radiology' },
    { id: crypto.randomUUID(), name: 'X-ray of right hand including wrist joint(LT)', price: 400, category: 'Radiology' },
    { id: crypto.randomUUID(), name: 'X-ray of right hand including wrist joint(RT)', price: 400, category: 'Radiology' },
  ];

  for (const test of defaultTests) {
    await addTest(test);
  }
};

// Backup operations
export const createBackup = async (): Promise<string> => {
  const database = await getDB();
  const patients = await getPatients();
  const tests = await getTests();
  
  const backup: Backup = {
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
    data: { patients, tests }
  };
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['backups'], 'readwrite');
    const store = transaction.objectStore('backups');
    const request = store.add(backup);
    
    request.onsuccess = () => resolve(backup.id);
    request.onerror = () => reject(request.error);
  });
};

export const getBackups = async (): Promise<Backup[]> => {
  const database = await getDB();
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['backups'], 'readonly');
    const store = transaction.objectStore('backups');
    const request = store.getAll();
    
    request.onsuccess = () => {
      const backups = request.result;
      // Keep only last 30 backups
      const sorted = backups.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );
      resolve(sorted.slice(0, 30));
    };
    request.onerror = () => reject(request.error);
  });
};

export const cleanOldBackups = async (): Promise<void> => {
  const database = await getDB();
  const backups = await getBackups();
  
  if (backups.length > 30) {
    const toDelete = backups.slice(30);
    const transaction = database.transaction(['backups'], 'readwrite');
    const store = transaction.objectStore('backups');
    
    for (const backup of toDelete) {
      store.delete(backup.id);
    }
  }
};

export const exportAllData = async (): Promise<string> => {
  const patients = await getPatients();
  const tests = await getTests();
  const backups = await getBackups();
  
  const exportData = {
    version: DB_VERSION,
    exportDate: new Date().toISOString(),
    data: { patients, tests, backups }
  };
  
  return JSON.stringify(exportData, null, 2);
};

export const importData = async (jsonData: string): Promise<void> => {
  const database = await getDB();
  const importedData = JSON.parse(jsonData);
  
  // Import patients
  if (importedData.data.patients) {
    const transaction = database.transaction(['patients'], 'readwrite');
    const store = transaction.objectStore('patients');
    
    for (const patient of importedData.data.patients) {
      await new Promise((resolve, reject) => {
        const request = store.put(patient);
        request.onsuccess = () => resolve(null);
        request.onerror = () => reject(request.error);
      });
    }
  }
  
  // Import tests
  if (importedData.data.tests) {
    const transaction = database.transaction(['tests'], 'readwrite');
    const store = transaction.objectStore('tests');
    
    for (const test of importedData.data.tests) {
      await new Promise((resolve, reject) => {
        const request = store.put(test);
        request.onsuccess = () => resolve(null);
        request.onerror = () => reject(request.error);
      });
    }
  }
};

// Auto-backup every 24 hours
let autoBackupInterval: number | null = null;

export const startAutoBackup = () => {
  if (autoBackupInterval) return;
  
  // Create backup immediately
  createBackup().then(() => console.log('Initial backup created'));
  
  // Then every 24 hours
  autoBackupInterval = window.setInterval(async () => {
    try {
      await createBackup();
      await cleanOldBackups();
      console.log('Auto-backup completed');
    } catch (error) {
      console.error('Auto-backup failed:', error);
    }
  }, 24 * 60 * 60 * 1000); // 24 hours
};

export const stopAutoBackup = () => {
  if (autoBackupInterval) {
    clearInterval(autoBackupInterval);
    autoBackupInterval = null;
  }
};

// Recover pending writes on app start
export const recoverPendingWrites = async (): Promise<void> => {
  const database = await getDB();
  
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(['pending_writes', 'patients', 'tests'], 'readwrite');
    const pendingStore = transaction.objectStore('pending_writes');
    const request = pendingStore.getAll();
    
    request.onsuccess = async () => {
      const pendingWrites: PendingWrite[] = request.result;
      
      for (const write of pendingWrites) {
        try {
          const store = transaction.objectStore(write.store);
          
          if (write.operation === 'add' || write.operation === 'update') {
            store.put(write.data);
          } else if (write.operation === 'delete') {
            store.delete(write.data.id);
          }
          
          // Clean up
          pendingStore.delete(write.id);
        } catch (error) {
          console.error('Failed to recover pending write:', error);
        }
      }
      
      resolve();
    };
    
    request.onerror = () => reject(request.error);
  });
};
