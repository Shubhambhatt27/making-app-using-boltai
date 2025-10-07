import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { Clock } from 'lucide-react-native';
import HealthScoreIndicator from './HealthScoreIndicator';

interface ScanCardProps {
  id: string;
  imageUrl: string;
  productName: string;
  score: number;
  timestamp: Date;
  explanation: string;
  onPress: () => void;
}

export default function ScanCard({ 
  imageUrl, 
  productName, 
  score, 
  timestamp, 
  explanation, 
  onPress 
}: ScanCardProps) {
  const formatTime = (date: Date) => {
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    if (diffInHours < 48) return 'Yesterday';
    return `${Math.floor(diffInHours / 24)} days ago`;
  };

  return (
    <TouchableOpacity style={styles.container} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <Image source={{ uri: imageUrl }} style={styles.productImage} />
        <View style={styles.headerInfo}>
          <Text style={styles.productName} numberOfLines={2}>
            {productName}
          </Text>
          <View style={styles.timeContainer}>
            <Clock size={12} color="#9CA3AF" />
            <Text style={styles.timeText}>{formatTime(timestamp)}</Text>
          </View>
        </View>
        <HealthScoreIndicator score={score} size="small" />
      </View>
      
      <Text style={styles.explanation} numberOfLines={3}>
        {explanation}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  productImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginLeft: 4,
  },
  explanation: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
});