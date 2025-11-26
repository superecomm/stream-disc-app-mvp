import { getAdminFirestore } from "./firebaseAdmin";
import type { ViimProfile, ViimVerification, ViimSession, ViimDataset, UserDoc, Voiceprint, VoiceprintSample } from "@/types/viim";
import { Timestamp } from "firebase-admin/firestore";
import { averageEmbeddings } from "./voiceprintUtils";

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

export async function getViimProfile(
  userId: string
): Promise<ViimProfile | null> {
  const adminFirestore = getAdminFirestore();
  const doc = await adminFirestore
    .collection("users")
    .doc(userId)
    .collection("viimProfile")
    .doc("profile")
    .get();
  
  if (!doc.exists) {
    return null;
  }
  return doc.data() as ViimProfile;
}

export async function createOrUpdateViimProfile(
  userId: string,
  samplesCount: number
): Promise<ViimProfile> {
  const adminFirestore = getAdminFirestore();
  const profileRef = adminFirestore
    .collection("users")
    .doc(userId)
    .collection("viimProfile")
    .doc("profile");
  
  const existingProfile = await profileRef.get();
  const now = Timestamp.now();
  const calibrationLevel = Math.min(samplesCount * 20, 100);

  if (existingProfile.exists) {
    const existing = existingProfile.data() as ViimProfile;
    // Preserve new fields if they exist, otherwise use legacy fields
    const mobileSamples = existing.mobileSamples !== undefined ? existing.mobileSamples : samplesCount;
    const studioSamples = existing.studioSamples || 0;
    const studioVerified = existing.studioVerified || false;
    const datasetCompletion = existing.datasetCompletion !== undefined 
      ? existing.datasetCompletion 
      : calculateDatasetCompletion(mobileSamples, studioSamples, studioVerified);
    const status = existing.status || determineStatus(mobileSamples, studioSamples, studioVerified);
    
    const updated: ViimProfile = {
      ...existing,
      viimId: existing.viimId || `VL-ARTIST-${Date.now().toString().slice(-6)}`,
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
    const viimId = `VIIM-ARTIST-${Date.now().toString().slice(-6)}`;
    const mobileSamples = samplesCount;
    const datasetCompletion = calculateDatasetCompletion(mobileSamples, 0, false);
    const status = determineStatus(mobileSamples, 0, false);
    
    const newProfile: ViimProfile = {
      viimId,
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

export async function addViimSession(
  userId: string,
  phrasesCount: number,
  source: "mobile" | "studio"
): Promise<{ session: ViimSession; profile: ViimProfile }> {
  const adminFirestore = getAdminFirestore();
  const now = Timestamp.now();
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Create session
  const session: ViimSession = {
    userId,
    sessionId,
    phrasesCount,
    createdAt: now,
    source,
  };

  await adminFirestore.collection("viimSessions").add(session);

  // Update profile
  const profileRef = adminFirestore
    .collection("users")
    .doc(userId)
    .collection("viimProfile")
    .doc("profile");

  const existingProfile = await profileRef.get();

  if (existingProfile.exists) {
    const existing = existingProfile.data() as ViimProfile;
    const mobileSamples = source === "mobile" 
      ? (existing.mobileSamples || 0) + 1 
      : (existing.mobileSamples || 0);
    const studioSamples = source === "studio"
      ? (existing.studioSamples || 0) + 1
      : (existing.studioSamples || 0);
    const studioVerified = existing.studioVerified || false;

    const datasetCompletion = calculateDatasetCompletion(mobileSamples, studioSamples, studioVerified);
    const status = determineStatus(mobileSamples, studioSamples, studioVerified);

    const updated: ViimProfile = {
      ...existing,
      viimId: existing.viimId || `VL-ARTIST-${Date.now().toString().slice(-6)}`,
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
    const viimId = `VL-ARTIST-${Date.now().toString().slice(-6)}`;
    const mobileSamples = source === "mobile" ? 1 : 0;
    const studioSamples = source === "studio" ? 1 : 0;
    const datasetCompletion = calculateDatasetCompletion(mobileSamples, studioSamples, false);
    const status = determineStatus(mobileSamples, studioSamples, false);

    const newProfile: ViimProfile = {
      viimId,
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

export async function createViimVerification(
  userId: string,
  assetId: string,
  result: { similarityScore: number; grade: "A" | "B" | "C" | "D"; serial: string }
): Promise<string> {
  const adminFirestore = getAdminFirestore();
  const verification: ViimVerification = {
    userId,
    assetId,
    similarityScore: result.similarityScore,
    grade: result.grade,
    serial: result.serial,
    createdAt: Timestamp.now(),
  };

  const docRef = await adminFirestore
    .collection("viimVerifications")
    .add(verification);
  
  return docRef.id;
}

export async function getUserVerifications(userId: string): Promise<ViimVerification[]> {
  const adminFirestore = getAdminFirestore();
  const snapshot = await adminFirestore
    .collection("viimVerifications")
    .where("userId", "==", userId)
    .orderBy("createdAt", "desc")
    .get();
  
  return snapshot.docs.map((doc) => doc.data() as ViimVerification);
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
): Promise<ViimDataset> {
  const adminFirestore = getAdminFirestore();
  const now = Timestamp.now();
  const datasetId = `dataset_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Deactivate all other datasets for this user
  const existingDatasets = await adminFirestore
    .collection("viimDatasets")
    .where("userId", "==", userId)
    .get();

  const batch = adminFirestore.batch();
  existingDatasets.docs.forEach((doc) => {
    batch.update(doc.ref, { isActive: false });
  });

  // Create new dataset
  const newDataset: ViimDataset = {
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

  const datasetRef = adminFirestore.collection("viimDatasets").doc();
  batch.set(datasetRef, newDataset);
  await batch.commit();

  // Return the dataset with the document ID
  const createdDoc = await datasetRef.get();
  if (!createdDoc.exists) {
    throw new Error("Failed to create dataset");
  }
  return createdDoc.data() as ViimDataset;
}

export async function getActiveDataset(userId: string): Promise<ViimDataset | null> {
  const adminFirestore = getAdminFirestore();
  const snapshot = await adminFirestore
    .collection("viimDatasets")
    .where("userId", "==", userId)
    .where("isActive", "==", true)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs[0].data() as ViimDataset;
}

export async function getUserDatasets(userId: string): Promise<ViimDataset[]> {
  const adminFirestore = getAdminFirestore();
  // Get all datasets and sort in memory to avoid index requirement
  const snapshot = await adminFirestore
    .collection("viimDatasets")
    .where("userId", "==", userId)
    .get();

  const datasets = snapshot.docs.map((doc) => doc.data() as ViimDataset);
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
): Promise<ViimDataset> {
  const adminFirestore = getAdminFirestore();

  // Deactivate all datasets
  const allDatasets = await adminFirestore
    .collection("viimDatasets")
    .where("userId", "==", userId)
    .get();

  const batch = adminFirestore.batch();
  allDatasets.docs.forEach((doc) => {
    batch.update(doc.ref, { isActive: false });
  });

  // Activate the selected dataset
  const targetDataset = await adminFirestore
    .collection("viimDatasets")
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

export async function addViimSessionToDataset(
  userId: string,
  datasetId: string,
  phrasesCount: number,
  source: "mobile" | "studio",
  options?: {
    studioId?: string;
    studioName?: string;
    vocalType?: "speech" | "singing" | "rapping" | "other";
    verified?: boolean;
    transcript?: string;
    chatMessages?: any[]; // ChatMessage[] from types
  }
): Promise<{ session: ViimSession; dataset: ViimDataset }> {
  const adminFirestore = getAdminFirestore();
  const now = Timestamp.now();
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Create session
  const session: ViimSession = {
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
    transcript: options?.transcript,
    chatMessages: options?.chatMessages,
  };

  await adminFirestore.collection("viimSessions").add(session);

  // Update dataset
  const datasetRef = adminFirestore
    .collection("viimDatasets")
    .where("userId", "==", userId)
    .where("datasetId", "==", datasetId)
    .limit(1);

  const datasetSnapshot = await datasetRef.get();
  
  if (datasetSnapshot.empty) {
    throw new Error("Dataset not found");
  }

  const datasetDoc = datasetSnapshot.docs[0];
  const existing = datasetDoc.data() as ViimDataset;

  const mobileSamples = source === "mobile" 
    ? existing.mobileSamples + 1 
    : existing.mobileSamples;
  const studioSamples = source === "studio"
    ? existing.studioSamples + 1
    : existing.studioSamples;
  const studioVerified = existing.studioVerified;

  const datasetCompletion = calculateDatasetCompletion(mobileSamples, studioSamples, studioVerified);
  const status = determineStatus(mobileSamples, studioSamples, studioVerified);

  const updated: ViimDataset = {
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

// ==================== Voiceprint Functions ====================

export async function createVoiceprint(
  userId: string,
  embedding: number[],
  sample: VoiceprintSample
): Promise<Voiceprint> {
  const adminFirestore = getAdminFirestore();
  const now = Timestamp.now();
  const voiceprintId = `vp_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const voiceprint: Voiceprint = {
    userId,
    voiceprintId,
    embedding,
    sampleCount: 1,
    samples: [sample],
    createdAt: now,
    updatedAt: now,
    modelVersion: "speechbrain/spkrec-ecapa-voxceleb",
  };

  const voiceprintRef = adminFirestore.collection("voiceprints").doc(voiceprintId);
  await voiceprintRef.set(voiceprint);

  // Store sample in subcollection
  await voiceprintRef
    .collection("samples")
    .doc(sample.sampleId)
    .set(sample);

  return voiceprint;
}

export async function updateVoiceprint(
  userId: string,
  newEmbedding: number[],
  newSample: VoiceprintSample
): Promise<Voiceprint> {
  const adminFirestore = getAdminFirestore();
  const now = Timestamp.now();

  // Find existing voiceprint for user
  const voiceprintsSnapshot = await adminFirestore
    .collection("voiceprints")
    .where("userId", "==", userId)
    .limit(1)
    .get();

  if (voiceprintsSnapshot.empty) {
    // Create new voiceprint if none exists
    return createVoiceprint(userId, newEmbedding, newSample);
  }

  const voiceprintDoc = voiceprintsSnapshot.docs[0];
  const existing = voiceprintDoc.data() as Voiceprint;

  // Get all sample embeddings
  const samplesSnapshot = await voiceprintDoc.ref
    .collection("samples")
    .get();

  const allEmbeddings = samplesSnapshot.docs.map((doc) => {
    const sample = doc.data() as VoiceprintSample;
    return sample.embedding;
  });
  allEmbeddings.push(newEmbedding);

  // Compute new average embedding
  const averagedEmbedding = averageEmbeddings(allEmbeddings);

  // Update voiceprint
  const updated: Voiceprint = {
    ...existing,
    embedding: averagedEmbedding,
    sampleCount: existing.sampleCount + 1,
    samples: [...existing.samples, newSample],
    updatedAt: now,
  };

  await voiceprintDoc.ref.update(updated);

  // Add new sample to subcollection
  await voiceprintDoc.ref
    .collection("samples")
    .doc(newSample.sampleId)
    .set(newSample);

  return updated;
}

export async function getVoiceprint(userId: string): Promise<Voiceprint | null> {
  const adminFirestore = getAdminFirestore();
  const snapshot = await adminFirestore
    .collection("voiceprints")
    .where("userId", "==", userId)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const doc = snapshot.docs[0];
  const voiceprint = doc.data() as Voiceprint;

  // Load samples from subcollection
  const samplesSnapshot = await doc.ref.collection("samples").get();
  voiceprint.samples = samplesSnapshot.docs.map(
    (sampleDoc) => sampleDoc.data() as VoiceprintSample
  );

  return voiceprint;
}

export async function getAllVoiceprints(): Promise<Voiceprint[]> {
  const adminFirestore = getAdminFirestore();
  const snapshot = await adminFirestore.collection("voiceprints").get();

  const voiceprints: Voiceprint[] = [];
  for (const doc of snapshot.docs) {
    const voiceprint = doc.data() as Voiceprint;

    // Load samples from subcollection
    const samplesSnapshot = await doc.ref.collection("samples").get();
    voiceprint.samples = samplesSnapshot.docs.map(
      (sampleDoc) => sampleDoc.data() as VoiceprintSample
    );

    voiceprints.push(voiceprint);
  }

  return voiceprints;
}

export async function findMatchingVoiceprints(
  queryEmbedding: number[],
  threshold: number = 0.7
): Promise<Array<{ userId: string; voiceprintId: string; similarity: number }>> {
  const adminFirestore = getAdminFirestore();
  const allVoiceprints = await getAllVoiceprints();

  const matches: Array<{ userId: string; voiceprintId: string; similarity: number }> = [];

  // Import cosine similarity function
  const { cosineSimilarity } = await import("./voiceprintUtils");

  for (const voiceprint of allVoiceprints) {
    const similarity = cosineSimilarity(queryEmbedding, voiceprint.embedding);
    if (similarity >= threshold) {
      matches.push({
        userId: voiceprint.userId,
        voiceprintId: voiceprint.voiceprintId,
        similarity,
      });
    }
  }

  // Sort by similarity (highest first)
  matches.sort((a, b) => b.similarity - a.similarity);

  return matches;
}

