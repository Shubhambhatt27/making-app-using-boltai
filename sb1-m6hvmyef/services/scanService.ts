import {
  ref,
  uploadBytes,
  getDownloadURL,
  uploadBytesResumable,
  UploadTaskSnapshot
} from 'firebase/storage';
import {
  collection,
  doc,
  setDoc,
  getDoc,
  query,
  where,
  orderBy,
  getDocs,
  onSnapshot,
  Timestamp
} from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { getFirebaseServices } from './firebase';
import { Scan } from '../types/models';

class ScanService {
  async uploadImage(imageUri: string, userId: string, scanId: string): Promise<string> {
    try {
      const { storage } = getFirebaseServices();

      const response = await fetch(imageUri);
      const blob = await response.blob();

      const fileName = `${scanId}_${Date.now()}.jpg`;
      const storageRef = ref(storage, `scan_images/${userId}/${fileName}`);

      await uploadBytes(storageRef, blob);

      const downloadURL = await getDownloadURL(storageRef);

      return downloadURL;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  }

  async uploadImageWithProgress(
    imageUri: string,
    userId: string,
    scanId: string,
    onProgress?: (progress: number) => void
  ): Promise<string> {
    try {
      const { storage } = getFirebaseServices();

      const response = await fetch(imageUri);
      const blob = await response.blob();

      const fileName = `${scanId}_${Date.now()}.jpg`;
      const storageRef = ref(storage, `scan_images/${userId}/${fileName}`);

      const uploadTask = uploadBytesResumable(storageRef, blob);

      return new Promise((resolve, reject) => {
        uploadTask.on(
          'state_changed',
          (snapshot: UploadTaskSnapshot) => {
            const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
            onProgress?.(progress);
          },
          (error) => {
            console.error('Upload error:', error);
            reject(new Error('Failed to upload image'));
          },
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          }
        );
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      throw new Error('Failed to upload image');
    }
  }

  async startScan(userId: string, imageUri: string, onProgress?: (progress: number) => void): Promise<string> {
    try {
      const { firestore } = getFirebaseServices();
      const scansRef = collection(firestore, 'scans');
      const scanDoc = doc(scansRef);
      const scanId = scanDoc.id;

      console.log('Starting scan process for scanId:', scanId);

      await this.uploadImageWithProgress(imageUri, userId, scanId, onProgress);

      console.log('Image uploaded successfully, Cloud Function will process it automatically');

      return scanId;
    } catch (error: any) {
      console.error('Error starting scan process:', error);
      throw new Error('Failed to start scan');
    }
  }

  async retryScan(scanId: string): Promise<void> {
    try {
      const { app } = getFirebaseServices();
      const functions = getFunctions(app);
      const retryScanFunction = httpsCallable(functions, 'retryScan');

      const result = await retryScanFunction({ scanId });

      console.log('Scan retry completed:', result.data);
    } catch (error: any) {
      console.error('Error retrying scan:', error);
      throw new Error(error.message || 'Failed to retry scan');
    }
  }

  async callAnalyzeIngredients(ingredients: string[]): Promise<any> {
    try {
      const { app } = getFirebaseServices();
      const functions = getFunctions(app);
      const analyzeFunction = httpsCallable(functions, 'analyzeIngredients');

      const result = await analyzeFunction({ ingredients });

      return result.data;
    } catch (error: any) {
      console.error('Error calling analyze function:', error);
      throw new Error(error.message || 'Failed to analyze ingredients');
    }
  }

  async getScan(scanId: string): Promise<Scan | null> {
    try {
      const { firestore } = getFirebaseServices();
      const scanRef = doc(firestore, 'scans', scanId);
      const scanDoc = await getDoc(scanRef);

      if (!scanDoc.exists()) {
        return null;
      }

      const data = scanDoc.data();
      return {
        scanId: data.scanId,
        ownerId: data.ownerId,
        createdAt: data.createdAt?.toDate() || new Date(),
        status: data.status,
        imageUrl: data.imageUrl,
        extractedIngredients: data.extractedIngredients,
        errorMessage: data.errorMessage,
        analysisResult: data.analysisResult
      };
    } catch (error) {
      console.error('Error getting scan:', error);
      return null;
    }
  }

  async getUserScans(userId: string, limit: number = 50): Promise<Scan[]> {
    try {
      const { firestore } = getFirebaseServices();
      const scansRef = collection(firestore, 'scans');
      const q = query(
        scansRef,
        where('ownerId', '==', userId),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);

      const scans: Scan[] = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          scanId: data.scanId,
          ownerId: data.ownerId,
          createdAt: data.createdAt?.toDate() || new Date(),
          status: data.status,
          imageUrl: data.imageUrl,
          extractedIngredients: data.extractedIngredients,
          errorMessage: data.errorMessage,
          analysisResult: data.analysisResult
        };
      });

      return scans;
    } catch (error) {
      console.error('Error fetching user scans:', error);
      return [];
    }
  }

  onScanUpdated(scanId: string, callback: (scan: Scan) => void): () => void {
    const { firestore } = getFirebaseServices();
    const scanRef = doc(firestore, 'scans', scanId);

    return onSnapshot(scanRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        const scan: Scan = {
          scanId: data.scanId,
          ownerId: data.ownerId,
          createdAt: data.createdAt?.toDate() || new Date(),
          status: data.status,
          imageUrl: data.imageUrl,
          extractedIngredients: data.extractedIngredients,
          errorMessage: data.errorMessage,
          analysisResult: data.analysisResult
        };
        callback(scan);
      }
    });
  }
}

export const scanService = new ScanService();
