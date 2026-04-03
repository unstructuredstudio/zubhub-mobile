import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function SplashScreen({ navigation }: { navigation: any }) {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = (dot: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ])
      );

    Animated.parallel([
      pulse(dot1, 0),
      pulse(dot2, 200),
      pulse(dot3, 400),
    ]).start();

    const timer = setTimeout(() => {
      navigation.replace('Onboarding');
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <LinearGradient
      colors={['#E53E3E', '#ED64A6', '#C53030']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <View style={styles.content}>
        <Text style={styles.logo}>ZubHub</Text>
        <Text style={styles.subtitle}>Creative Learning for Educators</Text>
        <View style={styles.dots}>
          {[dot1, dot2, dot3].map((dot, i) => (
            <Animated.View key={i} style={[styles.dot, { opacity: dot }]} />
          ))}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  logo: {
    fontSize: 56,
    fontWeight: '900', fontFamily: 'Raleway_800ExtraBold',
    color: '#FEE000',
    letterSpacing: -1,
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 6,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.9)',
    fontWeight: '600', fontFamily: 'Raleway_600SemiBold',
    marginTop: 8,
    marginBottom: 40,
  },
  dots: { flexDirection: 'row', gap: 8 },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
  },
});
