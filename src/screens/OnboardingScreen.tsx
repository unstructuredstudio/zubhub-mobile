import React, { useState, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Dimensions, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    icon: 'create-outline' as const,
    emoji: '✏️',
    color: '#E53E3E',
    bg: '#FED7D7',
    gradientColors: ['#FDE68A', '#FED7D7'] as [string, string],
    title: 'Share What You Know!',
    description: 'Create and publish creative learning activities. Help educators everywhere run better workshops.',
  },
  {
    icon: 'compass-outline' as const,
    emoji: '🔍',
    color: '#3182CE',
    bg: '#BEE3F8',
    gradientColors: ['#BEE3F8', '#EBF8FF'] as [string, string],
    title: 'Discover Activities',
    description: 'Browse hundreds of educator-tested activities. Filter by age, duration, and materials.',
  },
  {
    icon: 'people-circle-outline' as const,
    emoji: '🤝',
    color: '#38A169',
    bg: '#C6F6D5',
    gradientColors: ['#C6F6D5', '#F0FFF4'] as [string, string],
    title: 'Learn Together',
    description: 'Report how your sessions went, share what participants made, and help each other facilitate better.',
  },
];

export default function OnboardingScreen({ navigation }: { navigation: any }) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const goToSlide = (index: number) => {
    scrollRef.current?.scrollTo({ x: index * width, animated: true });
    setCurrentSlide(index);
  };

  const handleScroll = (e: any) => {
    const index = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrentSlide(index);
  };

  const slide = SLIDES[currentSlide];

  return (
    <LinearGradient colors={slide.gradientColors} style={styles.container}>
      <SafeAreaView style={styles.safe}>
        {/* Logo */}
        <View style={styles.logoRow}>
          <Image
            source={require('../../assets/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>

        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={handleScroll}
          style={styles.slider}
        >
          {SLIDES.map((s, i) => (
            <View key={i} style={[styles.slide, { width }]}>
              <View style={[styles.iconBox, { backgroundColor: s.bg }]}>
                <Ionicons name={s.icon} size={64} color={s.color} />
                <Text style={styles.slideEmoji}>{s.emoji}</Text>
              </View>
              <Text style={styles.slideTitle}>{s.title}</Text>
              <Text style={styles.slideDesc}>{s.description}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goToSlide(i)}>
              <View
                style={[
                  styles.dot,
                  currentSlide === i ? styles.dotActive : styles.dotInactive,
                ]}
              />
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.buttons}>
          <TouchableOpacity
            onPress={() => navigation.navigate('Auth', { screen: 'SignUp' })}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={['#E53E3E', '#ED64A6']}
              style={styles.primaryBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.primaryBtnText}>Get Started Free 🚀</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('Auth', { screen: 'SignIn' })}
            activeOpacity={0.8}
          >
            <Text style={styles.secondaryBtnText}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1 },
  logoRow: {
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 4,
  },
  logo: { height: 36, width: 140 },
  slider: { flex: 1 },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  iconBox: {
    width: 140,
    height: 140,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
    borderWidth: 3,
    borderColor: 'rgba(0,0,0,0.08)',
  },
  slideEmoji: {
    fontSize: 24,
    position: 'absolute',
    bottom: 8,
    right: 8,
  },
  slideTitle: {
    fontSize: 26,
    fontWeight: '900',
    fontFamily: 'Raleway_800ExtraBold',
    color: '#1A202C',
    textAlign: 'center',
    marginBottom: 14,
  },
  slideDesc: {
    fontSize: 16,
    color: '#4A5568',
    textAlign: 'center',
    lineHeight: 24,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
  },
  dot: { borderRadius: 4, height: 8 },
  dotActive: { width: 24, backgroundColor: '#E53E3E' },
  dotInactive: { width: 8, backgroundColor: '#CBD5E0' },
  buttons: { paddingHorizontal: 24, paddingBottom: 24, gap: 12 },
  primaryBtn: {
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnText: { color: '#fff', fontSize: 17, fontWeight: '700', fontFamily: 'Raleway_700Bold' },
  secondaryBtn: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#1A202C',
  },
  secondaryBtnText: { color: '#1A202C', fontSize: 17, fontWeight: '700', fontFamily: 'Raleway_700Bold' },
});
