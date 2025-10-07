export interface User {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  createdAt: Date;
}

export interface Scan {
  scanId: string;
  ownerId: string;
  createdAt: Date;
  status: 'processing' | 'analyzing' | 'complete' | 'error';
  imageUrl: string;
  extractedIngredients?: string[];
  errorMessage?: string;
  analysisResult?: AnalysisResult;
}

export interface AnalysisResult {
  score: number;
  explanation: string;
  pros: string[];
  cons: string[];
}

export interface HealthTip {
  id: string;
  title: string;
  content: string;
  category: 'nutrition' | 'exercise' | 'mental' | 'sleep' | 'hydration' | 'general';
  icon: string;
  createdAt: Date;
}

export interface UserHealthTips {
  userId: string;
  date: string;
  tipIds: string[];
  viewedAt?: Date;
}
