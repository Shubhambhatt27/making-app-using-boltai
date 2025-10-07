import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageSquare } from 'lucide-react-native';

interface ScanHistoryItem {
  id: string;
  timestamp: Date;
  imageUrl: string;
  score: number;
  productName: string;
  explanation: string;
}

export default function HistoryScreen() {
  // Mock data - In production, this would come from Firebase
  const scanHistory: ScanHistoryItem[] = [
    {
      id: '1',
      timestamp: new Date('2024-01-15T10:30:00'),
      imageUrl: 'https://images.pexels.com/photos/4113799/pexels-photo-4113799.jpeg?auto=compress&cs=tinysrgb&w=400',
      score: 8,
      productName: 'Organic Granola',
      explanation: 'Great choice! This product contains mostly whole food ingredients with minimal processing.',
    },
    {
      id: '2',
      timestamp: new Date('2024-01-14T15:45:00'),
      imageUrl: 'https://images.pexels.com/photos/4465831/pexels-photo-4465831.jpeg?auto=compress&cs=tinysrgb&w=400',
      score: 4,
      productName: 'Energy Drink',
      explanation: 'High in artificial ingredients and sugar. Consider healthier alternatives for sustained energy.',
    },
    {
      id: '3',
      timestamp: new Date('2024-01-13T09:15:00'),
      imageUrl: 'https://images.pexels.com/photos/7129166/pexels-photo-7129166.jpeg?auto=compress&cs=tinysrgb&w=400',
      score: 7,
      productName: 'Whole Grain Bread',
      explanation: 'Good source of fiber with mostly natural ingredients. Watch the sodium content.',
    },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 8) return '#10B981';
    if (score >= 6) return '#F59E0B';
    return '#EF4444';
  };

  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return diffInHours === 0 ? 'Just now' : `${diffInHours}h ago`;
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return `${Math.floor(diffInHours / 24)} days ago`;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Scan History</Text>
        <Text style={styles.subtitle}>Your ingredient analysis conversations</Text>
      </View>

      {scanHistory.length === 0 ? (
        <View style={styles.emptyState}>
          <MessageSquare size={64} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No scans yet</Text>
          <Text style={styles.emptyText}>
            Start scanning ingredient lists to build your health history
          </Text>
        </View>
      ) : (
        <ScrollView style={styles.chatContainer} showsVerticalScrollIndicator={false}>
          {scanHistory.map((item) => (
            <View key={item.id} style={styles.messageGroup}>
              {/* User message (image) */}
              <View style={styles.userMessage}>
                <Image source={{ uri: item.imageUrl }} style={styles.messageImage} />
                <Text style={styles.messageTime}>{formatTime(item.timestamp)}</Text>
              </View>

              {/* AI response */}
              <TouchableOpacity style={styles.aiMessage} activeOpacity={0.8}>
                <View style={styles.aiAvatar}>
                  <Text style={styles.aiAvatarText}>AI</Text>
                </View>
                <View style={styles.aiMessageContent}>
                  <View style={styles.analysisCard}>
                    <View style={styles.analysisHeader}>
                      <Text style={styles.productName}>{item.productName}</Text>
                      <View style={[styles.scoreIndicator, { backgroundColor: getScoreColor(item.score) }]}>
                        <Text style={styles.scoreText}>{item.score}/10</Text>
                      </View>
                    </View>
                    <Text style={styles.analysisText}>{item.explanation}</Text>
                  </View>
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    padding: 24,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 24,
  },
  chatContainer: {
    flex: 1,
    padding: 16,
  },
  messageGroup: {
    marginBottom: 24,
  },
  userMessage: {
    alignItems: 'flex-end',
    marginBottom: 12,
  },
  messageImage: {
    width: 200,
    height: 120,
    borderRadius: 12,
    marginBottom: 4,
  },
  messageTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginRight: 8,
  },
  aiMessage: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    marginTop: 4,
  },
  aiAvatarText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  aiMessageContent: {
    flex: 1,
  },
  analysisCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    borderTopLeftRadius: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  analysisHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  scoreIndicator: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  scoreText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  analysisText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
});