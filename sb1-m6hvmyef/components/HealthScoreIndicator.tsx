import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface HealthScoreIndicatorProps {
  score: number;
  size?: 'small' | 'medium' | 'large';
}

export default function HealthScoreIndicator({ score, size = 'medium' }: HealthScoreIndicatorProps) {
  const getScoreColor = (score: number) => {
    if (score >= 8) return '#10B981';
    if (score >= 6) return '#F59E0B';
    return '#EF4444';
  };

  const getScoreLabel = (score: number) => {
    if (score >= 8) return 'Excellent';
    if (score >= 6) return 'Good';
    if (score >= 4) return 'Fair';
    return 'Poor';
  };

  const sizeStyles = {
    small: {
      container: styles.smallContainer,
      scoreText: styles.smallScoreText,
      labelText: styles.smallLabelText,
    },
    medium: {
      container: styles.mediumContainer,
      scoreText: styles.mediumScoreText,
      labelText: styles.mediumLabelText,
    },
    large: {
      container: styles.largeContainer,
      scoreText: styles.largeScoreText,
      labelText: styles.largeLabelText,
    },
  };

  const currentSize = sizeStyles[size];
  const scoreColor = getScoreColor(score);

  return (
    <View style={[currentSize.container, { borderColor: scoreColor }]}>
      <Text style={[currentSize.scoreText, { color: scoreColor }]}>
        {score}/10
      </Text>
      <Text style={[currentSize.labelText, { color: scoreColor }]}>
        {getScoreLabel(score)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  smallContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  smallScoreText: {
    fontSize: 14,
    fontWeight: '700',
  },
  smallLabelText: {
    fontSize: 10,
    fontWeight: '500',
  },
  mediumContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    backgroundColor: '#FFFFFF',
  },
  mediumScoreText: {
    fontSize: 18,
    fontWeight: '700',
  },
  mediumLabelText: {
    fontSize: 12,
    fontWeight: '500',
  },
  largeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    backgroundColor: '#FFFFFF',
  },
  largeScoreText: {
    fontSize: 28,
    fontWeight: '700',
  },
  largeLabelText: {
    fontSize: 14,
    fontWeight: '600',
  },
});