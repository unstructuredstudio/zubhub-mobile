import { ClassAdaptations, Activity, FacilitationStep } from '../types';

/**
 * Calculate class-size adaptations for facilitation timing and tips.
 */
export function calculateAdaptations(numStudents: number): ClassAdaptations {
  let timeMultiplier = 1;
  const suggestions: string[] = [];
  let groupingAdvice = '';

  if (numStudents <= 15) {
    timeMultiplier = 0.85;
    suggestions.push('With a small group, you can do whole-class demos');
    suggestions.push('More time for individual help and questions');
    groupingAdvice = `Pairs work well (${Math.floor(numStudents / 2)} pairs)`;
  } else if (numStudents <= 25) {
    timeMultiplier = 1.0;
    suggestions.push('Organize into pairs for optimal collaboration');
    suggestions.push('Set up a materials station to avoid crowding');
    groupingAdvice = `Pairs work best (${Math.floor(numStudents / 2)} pairs)`;
  } else if (numStudents <= 32) {
    timeMultiplier = 1.2;
    suggestions.push('Large class - pre-cut materials to save time');
    suggestions.push('Consider station rotation or split into 2 groups');
    groupingAdvice = `Groups of 3-4 (${Math.floor(numStudents / 3)} groups)`;
  } else {
    timeMultiplier = 1.4;
    suggestions.push('Very large class - highly recommend splitting');
    suggestions.push('Pre-cut ALL materials and pre-test setup');
    suggestions.push('Recruit a helper if possible');
    groupingAdvice = `Groups of 4 (${Math.floor(numStudents / 4)} groups)`;
  }

  return { timeMultiplier, suggestions, groupingAdvice };
}

/**
 * Build facilitation steps from an Activity's step data.
 * Enriches each step with phase labels and AI-generated tips.
 */
export function buildFacilitationSteps(activity: Activity): FacilitationStep[] {
  const phaseLabels = ['Introduction', 'Inspiration', 'Creation', 'Construction', 'Practice', 'Performance', 'Reflection'];

  return activity.steps.map((step, index) => ({
    id: step.number,
    title: step.title,
    duration: step.duration_minutes,
    phase: phaseLabels[index % phaseLabels.length],
    content: step.description,
    aiTips: activity.tips?.[index] ? [activity.tips[index]] : [],
    educatorNotes: '',
    images: step.images,
  }));
}

/**
 * Format seconds into mm:ss display.
 */
export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculate adjusted total duration for an activity given student count.
 */
export function getAdjustedDuration(activity: Activity, numStudents: number): number {
  const adaptations = calculateAdaptations(numStudents);
  return Math.round(activity.duration_minutes * adaptations.timeMultiplier);
}
