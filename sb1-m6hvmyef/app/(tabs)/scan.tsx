import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Image, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import { Camera, RotateCcw, CircleCheck as CheckCircle, X } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { scanService } from '@/services/scanService';
import { authService } from '@/services/authService';
import { Scan } from '@/types/models';

type ScanStep = 'camera' | 'preview' | 'analyzing' | 'results';

interface AnalysisResult {
  score: number;
  explanation: string;
  pros: string[];
  cons: string[];
}

export default function ScanScreen() {
  const [step, setStep] = useState<ScanStep>('camera');
  const [facing, setFacing] = useState<CameraType>('back');
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [currentScanId, setCurrentScanId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const cameraRef = useRef<CameraView>(null);
  const router = useRouter();

  useEffect(() => {
    if (currentScanId) {
      const unsubscribe = scanService.onScanUpdated(currentScanId, (scan: Scan) => {
        console.log('Scan updated:', scan.status);

        if (scan.status === 'complete' && scan.analysisResult) {
          setAnalysisResult(scan.analysisResult);
          setStep('results');
        } else if (scan.status === 'error') {
          Alert.alert('Error', scan.errorMessage || 'Failed to analyze ingredients');
          setStep('preview');
        }
      });

      return () => unsubscribe();
    }
  }, [currentScanId]);

  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#10B981" />
        </View>
      </SafeAreaView>
    );
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.permissionContainer}>
          <Camera size={64} color="#10B981" />
          <Text style={styles.permissionTitle}>Camera Permission Required</Text>
          <Text style={styles.permissionText}>
            We need access to your camera to scan ingredient lists and analyze their health impact.
          </Text>
          <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          base64: false,
        });
        setCapturedImage(photo.uri);
        setStep('preview');
      } catch (error) {
        Alert.alert('Error', 'Failed to take picture. Please try again.');
      }
    }
  };

  const retakePicture = () => {
    setCapturedImage(null);
    setStep('camera');
  };

  const analyzePicture = async () => {
    if (!capturedImage) return;

    setStep('analyzing');
    setUploadProgress(0);

    try {
      const currentUser = authService.getCurrentUser();

      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to scan products');
        setStep('preview');
        return;
      }

      const scanId = await scanService.startScan(
        currentUser.uid,
        capturedImage,
        (progress) => {
          setUploadProgress(progress);
        }
      );

      setCurrentScanId(scanId);
      console.log('Scan started with ID:', scanId);

    } catch (error: any) {
      console.error('Error analyzing picture:', error);
      Alert.alert('Error', error.message || 'Failed to start analysis');
      setStep('preview');
    }
  };

  const startNewScan = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    setCurrentScanId(null);
    setUploadProgress(0);
    setStep('camera');
  };

  const getScoreColor = (score: number) => {
    if (score >= 8) return '#10B981';
    if (score >= 6) return '#F59E0B';
    return '#EF4444';
  };

  if (step === 'camera') {
    return (
      <SafeAreaView style={styles.container}>
        <CameraView ref={cameraRef} style={styles.camera} facing={facing}>
          <View style={styles.cameraOverlay}>
            <View style={styles.topBar}>
              <Text style={styles.instructionText}>Position ingredient list in the frame</Text>
            </View>
            
            <View style={styles.scanFrame} />
            
            <View style={styles.bottomBar}>
              <TouchableOpacity
                style={styles.flipButton}
                onPress={() => setFacing(current => (current === 'back' ? 'front' : 'back'))}
              >
                <RotateCcw size={24} color="#FFFFFF" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.captureButton} onPress={takePicture}>
                <View style={styles.captureInner} />
              </TouchableOpacity>
              
              <View style={styles.spacer} />
            </View>
          </View>
        </CameraView>
      </SafeAreaView>
    );
  }

  if (step === 'preview') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.previewContainer}>
          <View style={styles.previewHeader}>
            <TouchableOpacity onPress={retakePicture} style={styles.headerButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.previewTitle}>Review Your Scan</Text>
            <View style={styles.headerButton} />
          </View>
          
          {capturedImage && (
            <Image source={{ uri: capturedImage }} style={styles.previewImage} />
          )}
          
          <View style={styles.previewActions}>
            <TouchableOpacity style={styles.retakeButton} onPress={retakePicture}>
              <Text style={styles.retakeButtonText}>Retake</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.analyzeButton} onPress={analyzePicture}>
              <CheckCircle size={20} color="#FFFFFF" />
              <Text style={styles.analyzeButtonText}>Analyze</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'analyzing') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.analyzingContainer}>
          <View style={styles.analyzingContent}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.analyzingTitle}>Analyzing Ingredients</Text>
            <Text style={styles.analyzingText}>
              Our AI is examining the ingredient list and checking for health implications...
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (step === 'results' && analysisResult) {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView style={styles.resultsContainer} showsVerticalScrollIndicator={false}>
          <View style={styles.resultsHeader}>
            <TouchableOpacity onPress={startNewScan} style={styles.headerButton}>
              <X size={24} color="#6B7280" />
            </TouchableOpacity>
            <Text style={styles.resultsTitle}>Analysis Results</Text>
            <View style={styles.headerButton} />
          </View>

          <View style={styles.scoreCard}>
            <View style={styles.scoreHeader}>
              <Text style={styles.scoreLabel}>Health Score</Text>
              <View style={[styles.scoreBadge, { backgroundColor: getScoreColor(analysisResult.score) }]}>
                <Text style={styles.scoreValue}>{analysisResult.score}/10</Text>
              </View>
            </View>
            <Text style={styles.explanation}>{analysisResult.explanation}</Text>
          </View>

          <View style={styles.prosConsContainer}>
            <View style={styles.prosCard}>
              <Text style={styles.prosTitle}>✅ Good Ingredients</Text>
              {analysisResult.pros.map((pro, index) => (
                <Text key={index} style={styles.proItem}>• {pro}</Text>
              ))}
            </View>

            <View style={styles.consCard}>
              <Text style={styles.consTitle}>⚠️ Watch Out For</Text>
              {analysisResult.cons.map((con, index) => (
                <Text key={index} style={styles.conItem}>• {con}</Text>
              ))}
            </View>
          </View>

          <TouchableOpacity style={styles.newScanButton} onPress={startNewScan}>
            <Text style={styles.newScanButtonText}>Scan Another Product</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  topBar: {
    paddingTop: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  instructionText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  scanFrame: {
    flex: 1,
    marginHorizontal: 40,
    marginVertical: 60,
    borderWidth: 2,
    borderColor: '#10B981',
    borderRadius: 12,
    backgroundColor: 'transparent',
  },
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10B981',
  },
  spacer: {
    width: 50,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: '#F9FAFB',
  },
  permissionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 24,
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  permissionButton: {
    backgroundColor: '#10B981',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
  },
  permissionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  previewImage: {
    flex: 1,
    margin: 24,
    borderRadius: 12,
  },
  previewActions: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingBottom: 40,
    gap: 16,
  },
  retakeButton: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#10B981',
    backgroundColor: '#FFFFFF',
  },
  retakeButtonText: {
    color: '#10B981',
    fontSize: 16,
    fontWeight: '600',
  },
  analyzeButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#10B981',
    borderRadius: 12,
  },
  analyzeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  analyzingContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  analyzingContent: {
    alignItems: 'center',
    padding: 32,
  },
  analyzingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginTop: 24,
    marginBottom: 12,
  },
  analyzingText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  resultsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  resultsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  scoreCard: {
    backgroundColor: '#FFFFFF',
    margin: 24,
    padding: 24,
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  scoreHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  scoreLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  scoreBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  scoreValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  explanation: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
  },
  prosConsContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  prosCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  prosTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  proItem: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 6,
    lineHeight: 20,
  },
  consCard: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  consTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 12,
  },
  conItem: {
    fontSize: 14,
    color: '#374151',
    marginBottom: 6,
    lineHeight: 20,
  },
  newScanButton: {
    backgroundColor: '#10B981',
    margin: 24,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  newScanButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});