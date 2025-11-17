import { getAdminFirestore } from "./firebaseAdmin";
import type { VoiceLockProfile, VoiceLockVerification, VoiceLockSession, VoiceLockDataset, UserDoc } from "@/types/voiceLock";
import { Timestamp } from "firebase-admin/firestore";

export async function getUserDoc(userId: string): Promise<UserDoc | null> {
  const adminFirestore = getAdminFirestore();
  const doc = await adminFirestore.collection("users").doc(userId).get();
  if (!doc.exists) {
    return null;
  }
  return doc.data() as UserDoc;
}

export async function createOrUpdateUserDoc(
  userId: string,
  email: string
): Promise<UserDoc> {
  const adminFirestore = getAdminFirestore();
  const userRef = adminFirestore.collection("users").doc(userId);
  const userDoc = await userRef.get();

  if (userDoc.exists) {
    await userRef.update({
      updatedAt: Timestamp.now(),
    });
    return (await userRef.get()).data() as UserDoc;
  } else {
    const newUser: UserDoc = {
      email,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };
    await userRef.set(newUser);
    return newUser;
  }
}

export async function getVoiceLockProfile(
  userId: string
): Promise<VoiceLockProfile | null> {
  const adminFirestore = getAdminFirestore();
  const doc = await adminFirestore
    .collection("users")
    .doc(userId)
    .collection("voiceLockProfile")
    .doc("profile")
    .get();
  
  if (!doc.exists) {
    return null;
  }
  return doc.data() as VoiceLockProfile;
}

export async function createOrUpdateVoiceLockProfile(
  userId: string,
  samplesCount: number
): Promise<VoiceLockProfile> {
  const adminFirestore = getAdminFirestore();
  const profileRef = adminFirestore
    .collection("users")
    .doc(userId)
    .collection("voiceLockProfile")
    .doc("profile");
  
  const existingProfile = await profileRef.get();
  const now = Timestamp.now();
  const calibrationLevel = Math.min(samplesCount * 20, 100);

  if (existingProfile.exists) {
    const existing = existingProfile.data() as VoiceLockProfile;
    // Preserve new fields if they exist, otherwise use legacy fields
    const mobileSamples = existing.mobileSamples !== undefined ? existing.mobileSamples : samplesCount;
    const studioSamples = existing.studioSamples || 0;
    const studioVerified = existing.studioVerified || false;
    const datasetCompletion = existing.datasetCompletion !== undefined 
      ? existing.datasetCompletion 
      : calculateDatasetCompletion(mobileSamples, studioSamples, studioVerified);
    const status = existing.status || determineStatus(mobileSamples, studioSamples, studioVerified);
    
    const updated: VoiceLockProfile = {
      ...existing,
      voiceLockId: existing.voiceLockId || `VL-ARTIST-${Date.now().toString().slice(-6)}`,
      status,
      mobileSamples,
      studioSamples,
      studioVerified,
      datasetCompletion,
      samplesCount,
      calibrationLevel,
      updatedAt: now,
    };
    await profileRef.update(updated);
    return updated;
  } else {
    const voiceLockId = `VL-ARTIST-${Date.now().toString().slice(-6)}`;
    const mobileSamples = samplesCount;
    const datasetCompletion = calculateDatasetCompletion(mobileSamples, 0, false);
    const status = determineStatus(mobileSamples, 0, false);
    
    const newProfile: VoiceLockProfile = {
      voiceLockId,
      status,
      mobileSamples,
      studioSamples: 0,
      studioVerified: false,
      datasetCompletion,
      hasVoiceLock: true,
      samplesCount,
      calibrationLevel,
      createdAt: now,
      updatedAt: now,
    };
    await profileRef.set(newProfile);
    return newProfile;
  }
}

function calculateDatasetCompletion(
  mobileSamples: number,
  studioSamples: number,
  studioVerified: boolean
): number {
  const mobileScore = Math.min(mobileSamples * 10, 70);
  const studioScore = studioSamples > 0 && studioVerified ? 30 : 0;
  return mobileScore + studioScore;
}

function determineStatus(
  mobileSamples: number,
  studioSamples: number,
  studioVerified: boolean
): "not_started" | "mobile_enrolled" | "studio_verified" {
  if (studioSamples > 0 && studioVerified) {
    return "studio_verified";
  }
  if (mobileSamples > 0) {
    return "mobile_enrolled";
  }
  return "not_started";
}

export async function addVoiceLockSession(
  userId: string,
  phrasesCount: number,
  source: "mobile" | "studio"
): Promise<{ session: VoiceLockSession; profile: VoiceLockProfile }> {
  const adminFirestore = getAdminFirestore();
  const now = Timestamp.now();
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Create session
  const session: VoiceLockSession = {
    userId,
    sessionId,
    phrasesCount,
    createdAt: now,
    source,
  };

  await adminFirestore.collection("voiceLockSessions").add(session);

  // Update profile
  const profileRef = adminFirestore
    .collection("users")
    .doc(userId)
    .collection("voiceLockProfile")
    .doc("profile");

  const existingProfile = await profileRef.get();

  if (existingProfile.exists) {
    const existing = existingProfile.data() as VoiceLockProfile;
    const mobileSamples = source === "mobile" 
      ? (existing.mobileSamples || 0) + 1 
      : (existing.mobileSamples || 0);
    const studioSamples = source === "studio"
      ? (existing.studioSamples || 0) + 1
      : (existing.studioSamples || 0);
    const studioVerified = existing.studioVerified || false;

    const datasetCompletion = calculateDatasetCompletion(mobileSamples, studioSamples, studioVerified);
    const status = determineStatus(mobileSamples, studioSamples, studioVerified);

    const updated: VoiceLockProfile = {
      ...existing,
      voiceLockId: existing.voiceLockId || `VL-ARTIST-${Date.now().toString().slice(-6)}`,
      status,
      mobileSamples,
      studioSamples,
      studioVerified,
      datasetCompletion,
      updatedAt: now,
    };

    await profileRef.update(updated);
    return { session, profile: updated };
  } else {
    // Create new profile
    const voiceLockId = `VL-ARTIST-${Date.now().toString().slice(-6)}`;
    const mobileSamples = source === "mobile" ? 1 : 0;
    const studioSamples = source === "studio" ? 1 : 0;
    const datasetCompletion = calculateDatasetCompletion(mobileSamples, studioSamples, false);
    const status = determineStatus(mobileSamples, studioSamples, false);

    const newProfile: VoiceLockProfile = {
      voiceLockId,
      status,
      mobileSamples,
      studioSamples,
      studioVerified: false,
      datasetCompletion,
      createdAt: now,
      updatedAt: now,
    };

    await profileRef.set(newProfile);
    return { session, profile: newProfile };
  }
}

export async function createVoiceLockVerification(
  userId: string,
  assetId: string,
  result: { similarityScore: number; grade: "A" | "B" | "C" | "D"; serial: string }
): Promise<string> {
  const adminFirestore = getAdminFirestore();
  const verification: VoiceLockVerification = {
    userId,
    assetId,
    similarityScore: result.similarityScore,
    grade: result.grade,
    serial: result.serial,
    createdAt: Timestamp.now(),
  };

  const docRef = await adminFirestore
    .collection("voiceLockVerifications")
    .add(verification);
  
  return docRef.id;
}

export async function getUserVerifications(userId: string): Promise<VoiceLockVerification[]> {
  const adminFirestore = getAdminFirestore();
  const snapshot = await adminFirestore
    .collection("voiceLockVerifications")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .get();
  
  return snapshot.docs.map((doc) => doc.data() as VoiceLockVerification);
}

export async function getVerificationStats(userId: string): Promise<{
  totalVerifications: number;
  uniqueAssetsCount: number;
}> {
  const verifications = await getUserVerifications(userId);
  const uniqueAssets = new Set(verifications.map((v) => v.assetId));
  
  return {
    totalVerifications: verifications.length,
    uniqueAssetsCount: uniqueAssets.size,
  };
}

// Dataset management functions
export async function createDataset(
  userId: string,
  name: string
): Promise<VoiceLockDataset> {
  const adminFirestore = getAdminFirestore();
  const now = Timestamp.now();
  const datasetId = `dataset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Deactivate all other datasets for this user
  const existingDatasets = await adminFirestore
    .collection("voiceLockDatasets")
    .where("userId", "==", userId)
    .get();

  const batch = adminFirestore.batch();
  existingDatasets.docs.forEach((doc) => {
    batch.update(doc.ref, { isActive: false });
  });

  // Create new dataset
  const newDataset: VoiceLockDataset = {
    userId,
    datasetId,
    name,
    status: "not_started",
    mobileSamples: 0,
    studioSamples: 0,
    studioVerified: false,
    datasetCompletion: 0,
    createdAt: now,
    updatedAt: now,
    isActive: true,
  };

  const datasetRef = adminFirestore.collection("voiceLockDatasets").doc();
  batch.set(datasetRef, newDataset);
  await batch.commit();

  // Return the dataset with the document ID
  const createdDoc = await datasetRef.get();
  if (!createdDoc.exists) {
    throw new Error("Failed to create dataset");
  }
  return createdDoc.data() as VoiceLockDataset;
}

export async function getActiveDataset(userId: string): Promise<VoiceLockDataset | null> {
  const adminFirestore = getAdminFirestore();
  const snapshot = await adminFirestore
    .collection("voiceLockDatasets")
    .where("userId", "==", userId)
    .where("isActive", "==", true)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].data() as VoiceLockDataset;
}

export async function getUserDatasets(userId: string): Promise<VoiceLockDataset[]> {
  const adminFirestore = getAdminFirestore();
  // Get all datasets and sort in memory to avoid index requirement
  const snapshot = await adminFirestore
    .collection("voiceLockDatasets")
    .where("userId", "==", userId)
    .get();

  const datasets = snapshot.docs.map((doc) => doc.data() as VoiceLockDataset);
  // Sort by updatedAt descending
  datasets.sort((a, b) => {
    const aTime = a.updatedAt.toMillis();
    const bTime = b.updatedAt.toMillis();
    return bTime - aTime;
  });

  return datasets;
}

export async function switchActiveDataset(
  userId: string,
  datasetId: string
): Promise<VoiceLockDataset> {
  const adminFirestore = getAdminFirestore();

  // Deactivate all datasets
  const allDatasets = await adminFirestore
    .collection("voiceLockDatasets")
    .where("userId", "==", userId)
    .get();

  const batch = adminFirestore.batch();
  allDatasets.docs.forEach((doc) => {
    batch.update(doc.ref, { isActive: false });
  });

  // Activate the selected dataset
  const targetDataset = await adminFirestore
    .collection("voiceLockDatasets")
    .where("userId", "==", userId)
    .where("datasetId", "==", datasetId)
    .limit(1)
    .get();

  if (!targetDataset.empty) {
    batch.update(targetDataset.docs[0].ref, { 
      isActive: true,
      updatedAt: Timestamp.now(),
    });
  }

  await batch.commit();

  const activeDataset = await getActiveDataset(userId);
  if (!activeDataset) {
    throw new Error("Failed to activate dataset");
  }

  return activeDataset;
}

export async function addVoiceLockSessionToDataset(
  userId: string,
  datasetId: string,
  phrasesCount: number,
  source: "mobile" | "studio",
  options?: {
    studioId?: string;
    studioName?: string;
    vocalType?: "speech" | "singing" | "rapping" | "other";
    verified?: boolean;
  }
): Promise<{ session: VoiceLockSession; dataset: VoiceLockDataset }> {
  const adminFirestore = getAdminFirestore();
  const now = Timestamp.now();
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Create session
  const session: VoiceLockSession = {
    userId,
    sessionId,
    phrasesCount,
    createdAt: now,
    source,
    datasetId,
    studioId: options?.studioId,
    studioName: options?.studioName,
    vocalType: options?.vocalType || "speech",
    verified: options?.verified || false,
  };

  await adminFirestore.collection("voiceLockSessions").add(session);

  // Update dataset
  const datasetRef = adminFirestore
    .collection("voiceLockDatasets")
    .where("userId", "==", userId)
    .where("datasetId", "==", datasetId)
    .limit(1);

  const datasetSnapshot = await datasetRef.get();
  
  if (datasetSnapshot.empty) {
    throw new Error("Dataset not found");
  }

  const datasetDoc = datasetSnapshot.docs[0];
  const existing = datasetDoc.data() as VoiceLockDataset;

  const mobileSamples = source === "mobile" 
    ? existing.mobileSamples + 1 
    : existing.mobileSamples;
  const studioSamples = source === "studio"
    ? existing.studioSamples + 1
    : existing.studioSamples;
  const studioVerified = existing.studioVerified;

  const datasetCompletion = calculateDatasetCompletion(mobileSamples, studioSamples, studioVerified);
  const status = determineStatus(mobileSamples, studioSamples, studioVerified);

  const updated: VoiceLockDataset = {
    ...existing,
    mobileSamples,
    studioSamples,
    datasetCompletion,
    status,
    updatedAt: now,
  };

  await datasetDoc.ref.update(updated);

  return { session, dataset: updated };
}

