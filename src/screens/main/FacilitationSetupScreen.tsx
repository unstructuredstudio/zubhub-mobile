import React, { useEffect } from 'react';
import {
  View, Text, ActivityIndicator,
} from 'react-native';
import { Colors } from '../../theme';
import { useStore } from '../../store/useStore';
import { calculateAdaptations, buildFacilitationSteps } from '../../services/facilitation';

export default function FacilitationSetupScreen({ route, navigation }: { route: any; navigation: any }) {
  const activity = route.params?.activity;
  const {
    resetFacilitation, setFacilitationStep, setFacilitationTime,
    setFacilitationTimerRunning, startFacilitationRun,
  } = useStore();

  useEffect(() => {
    if (!activity) return;

    // Use default medium class size (24 students) and go directly to facilitation
    const studentCount = 24;
    const adaptations = calculateAdaptations(studentCount);
    const steps = buildFacilitationSteps(activity);

    resetFacilitation();
    // Stamped before the run rather than at the end, so the session records how
    // long it actually took instead of a zero-length window.
    startFacilitationRun();
    const firstStepTime = Math.round((steps[0]?.duration || 15) * adaptations.timeMultiplier * 60);
    setFacilitationStep(0);
    setFacilitationTime(firstStepTime);
    setFacilitationTimerRunning(false);

    navigation.replace('FacilitationActive', {
      activity,
      studentCount,
      adaptations,
    });
  }, [activity]);

  if (!activity) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
        <Text style={{ color: Colors.textMuted }}>Activity not found.</Text>
      </View>
    );
  }

  // Brief loading state while navigating
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={{ color: Colors.textMuted, marginTop: 12 }}>Starting facilitation...</Text>
    </View>
  );
}
