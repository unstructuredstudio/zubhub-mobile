import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, Image,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { DraftActivity, Activity, ActivityStep, Category, CATEGORIES, Material } from '../../types';
import { createActivity, createRemix, updateActivity } from '../../services/api';
import { trackActivityCreation, trackRemix } from '../../services/analytics';
import { notifyActivityPublished, sendPushToUser } from '../../services/notifications';
import { pickAndUploadImage } from '../../services/upload';

// ─── Draft parsing helpers ─────────────────────────────────────────────────────

function parseDuration(timing: string): number {
  const match = timing.match(/(\d+)\s*min/i);
  return match ? parseInt(match[1], 10) : 60;
}

function parseAge(timing: string): { min: number; max?: number } {
  const rangeMatch = timing.match(/age[s]?\s*(\d+)[–\-to]+(\d+)/i);
  if (rangeMatch) return { min: parseInt(rangeMatch[1], 10), max: parseInt(rangeMatch[2], 10) };
  const singleMatch = timing.match(/age[s]?\s*(\d+)/i);
  return { min: singleMatch ? parseInt(singleMatch[1], 10) : 8 };
}

function parseMaterials(raw: string) {
  return raw
    .split(/[,\n]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((name) => ({
      name,
      buy_hint: getBuyHint(name),
      amazon_url: null as string | null,
    }));
}

function getBuyHint(material: string): string {
  const m = material.toLowerCase();
  if (m.includes('app') || m.includes('studio') || m.includes('software')) return 'Free app on App Store or Google Play';
  if (m.includes('paper') || m.includes('card')) return 'Any stationery shop';
  if (m.includes('tape') || m.includes('glue') || m.includes('scissor')) return 'Stationery or hardware store';
  if (m.includes('led') || m.includes('battery') || m.includes('circuit') || m.includes('wire')) return 'Electronics store';
  if (m.includes('clay') || m.includes('paint') || m.includes('brush')) return 'Art supply store';
  if (m.includes('phone') || m.includes('tablet') || m.includes('device')) return 'Use school or personal devices';
  if (m.includes('fabric') || m.includes('cloth') || m.includes('sock')) return 'Fabric store or reuse old clothes';
  if (m.includes('marker') || m.includes('pen') || m.includes('pencil')) return 'Any stationery shop';
  return 'Local market or online stores';
}

function parseTips(raw: string): string[] {
  return raw
    .split(/[.\n]+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3);
}

function generateSmartTitle(description: string): string {
  const text = description.trim();

  // Extract key activity verb + noun
  const activityPatterns = [
    /make\s+(?:a\s+)?([a-z\s]{3,25})/i,
    /build\s+(?:a\s+)?([a-z\s]{3,25})/i,
    /create\s+(?:a\s+)?([a-z\s]{3,25})/i,
    /design\s+(?:a\s+)?([a-z\s]{3,25})/i,
    /craft\s+(?:a\s+)?([a-z\s]{3,25})/i,
    /([a-z\s]{3,20})\s+activity/i,
    /([a-z\s]{3,20})\s+workshop/i,
    /([a-z\s]{3,20})\s+challenge/i,
  ];

  for (const pattern of activityPatterns) {
    const match = text.match(pattern);
    if (match) {
      const core = match[1].trim().split(/\s+/).slice(0, 4).join(' ');
      return core.charAt(0).toUpperCase() + core.slice(1) + ' Workshop';
    }
  }

  // Fallback: first meaningful noun phrase (max 5 words, exclude filler)
  const stopWords = new Set(['they', 'will', 'the', 'a', 'an', 'this', 'that', 'with', 'and', 'for', 'to', 'in', 'on', 'at', 'of', 'is', 'are', 'was', 'were', 'be', 'have', 'has', 'do', 'does', 'my', 'their', 'our', 'i', 'we', 'you']);
  const words = text.split(/\s+/).filter(w => !stopWords.has(w.toLowerCase()) && w.length > 2);
  const titleWords = words.slice(0, 4);
  if (titleWords.length === 0) return 'New Activity';
  return titleWords.map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

function parseSteps(
  raw: string | undefined,
  description: string,
  duration: number,
  materialsRaw: string,
): ReturnType<typeof generateSteps> {
  if (!raw?.trim()) return generateSteps(description, duration, materialsRaw);

  const lines = raw.split(/\n+/).map((s) => s.trim()).filter(Boolean);
  const stepPattern = /^(?:step\s*)?(\d+)[.:)]\s*(.+)/i;
  const parsed: ReturnType<typeof generateSteps> = [];
  const perStep = Math.max(Math.round(duration / Math.max(lines.length, 1)), 5);

  for (const line of lines) {
    const match = line.match(stepPattern);
    if (match) {
      const num = parseInt(match[1], 10);
      const content = match[2].trim();
      const colonIdx = content.indexOf(':');
      let stepTitle: string;
      let stepDesc: string;
      if (colonIdx > 0 && colonIdx < 40) {
        stepTitle = content.substring(0, colonIdx).trim();
        stepDesc = content.substring(colonIdx + 1).trim() || stepTitle;
      } else {
        stepTitle = content.length > 35 ? content.substring(0, 35).trim() + '…' : content;
        stepDesc = content;
      }
      parsed.push({ number: num, title: stepTitle, description: stepDesc, duration_minutes: perStep, tip: undefined });
    }
  }

  if (parsed.length > 0) return parsed;

  // Fallback: treat each non-empty line as a step
  return lines.map((line, idx) => ({
    number: idx + 1,
    title: line.length > 35 ? line.substring(0, 35).trim() + '…' : line,
    description: line,
    duration_minutes: perStep,
    tip: undefined,
  }));
}

function generateSteps(description: string, duration: number, materialsRaw: string) {
  const buildTime = Math.max(duration - 30, 15);

  // Try to extract domain-specific steps from the description
  const hasSolar = /solar/i.test(description);
  const hasCircuit = /circuit|led|electric/i.test(description);
  const hasPuppet = /puppet|puppet/i.test(description);
  const hasStory = /story|narrative|write/i.test(description);
  const hasArt = /draw|paint|sketch|collage/i.test(description);

  if (hasSolar) {
    return [
      { number: 1, title: 'Introduction to Solar Energy', description: 'Explain how solar panels convert sunlight into electricity. Show examples.', duration_minutes: 10, tip: 'Use simple diagrams. Keep it visual!' },
      { number: 2, title: 'Design Your Contraption', description: 'Participants sketch their solar-powered device and plan the components.', duration_minutes: 10, tip: 'Encourage creative, unusual ideas' },
      { number: 3, title: 'Build & Connect', description: 'Assemble the solar contraption using provided materials.', duration_minutes: buildTime, tip: 'Test in direct sunlight for best results' },
      { number: 4, title: 'Test & Showcase', description: 'Take contraptions outside to test. Present how each one works.', duration_minutes: 10, tip: undefined },
    ];
  }

  if (hasCircuit) {
    return [
      { number: 1, title: 'Circuit Basics', description: 'Introduce electricity and circuits. Show a simple working example.', duration_minutes: 10, tip: 'Long LED leg = positive terminal' },
      { number: 2, title: 'Plan Your Design', description: 'Participants sketch their circuit design and mark where components go.', duration_minutes: 10, tip: undefined },
      { number: 3, title: 'Build the Circuit', description: 'Assemble the circuit using copper tape, LEDs and batteries.', duration_minutes: buildTime, tip: 'Press tape firmly at bends' },
      { number: 4, title: 'Test & Troubleshoot', description: 'Test circuits and fix any breaks. Share results.', duration_minutes: 10, tip: undefined },
    ];
  }

  // Generic but activity-aware steps
  return [
    { number: 1, title: 'Introduce the Activity', description: `Welcome participants and explain what they will ${description.toLowerCase().includes('make') || description.toLowerCase().includes('build') || description.toLowerCase().includes('create') ? 'create' : 'do'} today.`, duration_minutes: 10, tip: 'Start with a question to spark curiosity!' },
    { number: 2, title: 'Demonstrate', description: 'Walk through the key steps or techniques participants will use.', duration_minutes: 10, tip: 'Show, don\'t just tell. Do a live demo' },
    { number: 3, title: 'Create & Explore', description: 'Participants work on their own with your guidance and support.', duration_minutes: buildTime, tip: 'Walk around and encourage everyone' },
    { number: 4, title: 'Share & Reflect', description: 'Each person or group shares their creation. Discuss what worked and what they learned.', duration_minutes: 10, tip: undefined },
  ];
}

function detectCategory(description: string, tags: string[]): Category {
  const text = `${description} ${tags.join(' ')}`.toLowerCase();
  if (/circuit|led|copper tape|battery|electric/i.test(text)) return 'Circuits';
  if (/cod|program|algorithm|app|software/i.test(text)) return 'Coding';
  if (/film|animat|stop motion|movie|video/i.test(text)) return 'Film';
  if (/engineer|bridge|solar|mechan|construct/i.test(text)) return 'Engineering';
  if (/music|rhythm|instrument|sing|drum/i.test(text)) return 'Music';
  if (/nature|outdoor|environment|plant|ecosystem/i.test(text)) return 'Nature';
  if (/story|writ|narrative|zine|language|literacy/i.test(text)) return 'Storytelling';
  if (/drama|puppet|theater|theatre|perform|role|character/i.test(text)) return 'Drama';
  if (/science|experiment|chemistry|biology|physics/i.test(text)) return 'Science';
  return 'Art';
}

function generateObjectives(description: string): string[] {
  const objectives = ['Develop hands-on making skills'];

  if (/solar|energy|electric|circuit|battery|led/i.test(description))
    objectives.push('Understand basic science or engineering concepts');
  if (/story|narrative|write|puppet|film|animation/i.test(description))
    objectives.push('Express ideas through creative storytelling');
  if (/team|group|together|collab/i.test(description))
    objectives.push('Practice teamwork and communication');
  if (/nature|outdoor|environment|sound|observe/i.test(description))
    objectives.push('Build observation and mindfulness skills');
  if (/art|draw|paint|design|craft/i.test(description))
    objectives.push('Explore visual creativity and aesthetics');

  if (objectives.length < 3)
    objectives.push('Build confidence through completing a project');

  return objectives;
}

// ─── Editable List Item ────────────────────────────────────────────────────────

function EditableListItem({
  value, onChangeText, onRemove, placeholder,
}: {
  value: string; onChangeText: (v: string) => void; onRemove: () => void; placeholder?: string;
}) {
  return (
    <View style={styles.editableRow}>
      <TextInput
        style={styles.editableInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder ?? 'Enter item...'}
        placeholderTextColor="#A0AEC0"
        multiline
      />
      <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
        <Ionicons name="close-circle" size={18} color="#FC8181" />
      </TouchableOpacity>
    </View>
  );
}

// ─── Editable Step Item ────────────────────────────────────────────────────────

function EditableStep({ step, onChange, onRemove, onAddImage, onRemoveImage, uploading }: {
  step: { number: number; title: string; description: string; duration_minutes: number; tip?: string; images: string[] };
  onChange: (updated: typeof step) => void;
  onRemove: () => void;
  onAddImage: () => void;
  onRemoveImage: (idx: number) => void;
  uploading: boolean;
}) {
  return (
    <View style={styles.stepEditCard}>
      <View style={styles.stepEditHeader}>
        <View style={styles.stepNum}>
          <Text style={styles.stepNumText}>{step.number}</Text>
        </View>
        <TextInput
          style={styles.stepTitleInput}
          value={step.title}
          onChangeText={(v) => onChange({ ...step, title: v })}
          placeholder="Step title"
          placeholderTextColor="#A0AEC0"
        />
        <View style={styles.stepDurWrapper}>
          <TextInput
            style={styles.stepDurInput}
            value={String(step.duration_minutes)}
            onChangeText={(v) => onChange({ ...step, duration_minutes: parseInt(v) || 0 })}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor="#A0AEC0"
          />
          <Text style={styles.stepDurLabel}>min</Text>
        </View>
        <TouchableOpacity onPress={onRemove}>
          <Ionicons name="close-circle" size={18} color="#FC8181" />
        </TouchableOpacity>
      </View>
      <TextInput
        style={styles.stepDescInput}
        value={step.description}
        onChangeText={(v) => onChange({ ...step, description: v })}
        placeholder="Step description..."
        placeholderTextColor="#A0AEC0"
        multiline
      />
      {/* Step image strip */}
      <View style={styles.stepImageRow}>
        {step.images.map((uri, idx) => (
          <View key={idx} style={styles.stepThumbWrap}>
            <Image source={{ uri }} style={styles.stepThumb} />
            <TouchableOpacity style={styles.stepThumbRemove} onPress={() => onRemoveImage(idx)}>
              <Ionicons name="close-circle" size={16} color="#E53E3E" />
            </TouchableOpacity>
          </View>
        ))}
        {step.images.length < 2 && (
          <TouchableOpacity style={styles.stepAddImageBtn} onPress={onAddImage} disabled={uploading}>
            {uploading ? (
              <ActivityIndicator size="small" color="#718096" />
            ) : (
              <>
                <Ionicons name="camera-outline" size={16} color="#718096" />
                <Text style={styles.stepAddImageText}>Photo</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>
      {/* Facilitation tip for this step */}
      <View style={styles.stepTipRow}>
        <Ionicons name="sparkles" size={13} color="#B7791F" style={{ marginTop: 3 }} />
        <TextInput
          style={styles.stepTipInput}
          value={step.tip ?? ''}
          onChangeText={(v) => onChange({ ...step, tip: v || undefined })}
          placeholder="Facilitation tip for this step (optional)"
          placeholderTextColor="#C4A96A"
          multiline
        />
      </View>
    </View>
  );
}

/** Activity cards show the cover wide, so crop it to match. */
const COVER_ASPECT: [number, number] = [16, 9];

// ─── Editable Material Item ────────────────────────────────────────────────────

function EditableMaterial({ item, onChange, onRemove }: {
  item: { name: string; buy_hint: string; amazon_url: string | null };
  onChange: (updated: typeof item) => void;
  onRemove: () => void;
}) {
  return (
    <View style={styles.materialEditCard}>
      <View style={styles.materialEditRow}>
        <TextInput
          style={[styles.editableInput, { flex: 1 }]}
          value={item.name}
          onChangeText={(v) => onChange({ ...item, name: v, buy_hint: getBuyHint(v) })}
          placeholder="Material name"
          placeholderTextColor="#A0AEC0"
        />
        <TouchableOpacity onPress={onRemove} style={styles.removeBtn}>
          <Ionicons name="close-circle" size={18} color="#FC8181" />
        </TouchableOpacity>
      </View>
      {item.buy_hint ? (
        <Text style={styles.buyHintText}>💡 Where to get: {item.buy_hint}</Text>
      ) : null}
      <TextInput
        style={styles.urlInput}
        value={item.amazon_url ?? ''}
        onChangeText={(v) => onChange({ ...item, amazon_url: v || null })}
        placeholder="Buy link (optional, e.g. Amazon URL)"
        placeholderTextColor="#A0AEC0"
        autoCapitalize="none"
        keyboardType="url"
      />
    </View>
  );
}

// ─── Card Component ────────────────────────────────────────────────────────────

function Card({ label, children, onAdd }: { label: string; children: React.ReactNode; onAdd?: () => void }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardLabel}>{label}</Text>
        {onAdd && (
          <TouchableOpacity onPress={onAdd} style={styles.addBtn}>
            <Ionicons name="add-circle-outline" size={18} color="#E53E3E" />
            <Text style={styles.addBtnText}>Add</Text>
          </TouchableOpacity>
        )}
      </View>
      {children}
    </View>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

/** Compare the parts of an activity a remix is expected to change. */
function remixDiffersFromSource(
  source: Activity,
  next: {
    title: string; description: string; durationVal: string;
    minAge: string; maxAge: string;
    materials: { name: string }[];
    steps: { title?: string; description?: string }[];
    tips: string[]; objectives: string[];
  },
): boolean {
  const norm = (v: unknown) => String(v ?? '').trim().toLowerCase();
  const list = (xs: string[]) => xs.map(norm).filter(Boolean).join('|');

  if (norm(source.title) !== norm(next.title)) return true;
  if (norm(source.description) !== norm(next.description)) return true;
  if (String(source.duration_minutes) !== next.durationVal.trim()) return true;
  if (String(source.min_age) !== next.minAge.trim()) return true;
  if (String(source.max_age ?? '') !== next.maxAge.trim()) return true;
  if (list(source.materials.map((m) => m.name)) !== list(next.materials.map((m) => m.name))) return true;
  if (list(source.tips ?? []) !== list(next.tips)) return true;
  if (list(source.objectives ?? []) !== list(next.objectives)) return true;

  const sourceSteps = (source.steps ?? []).map(
    (st: any) => `${norm(st.title)}~${norm(st.description)}`,
  ).join('|');
  const nextSteps = next.steps.map(
    (st: any) => `${norm(st.title)}~${norm(st.description)}`,
  ).join('|');
  if (sourceSteps !== nextSteps) return true;

  return false;
}

/**
 * Inside the editor a material always carries its sourcing hint and a step
 * always carries an images array, because every branch that seeds this state
 * fills them in. The stored types leave both optional, so the editor states are
 * narrowed here rather than guarded at every use site.
 */
type EditableMaterial = Omit<Material, 'buy_hint' | 'amazon_url'> & {
  buy_hint: string;
  amazon_url: string | null;
};
type EditableStep = Omit<ActivityStep, 'images'> & { images: string[] };

export default function ReviewActivityScreen({ route, navigation }: { route: any; navigation: any }) {
  const existingActivity: Activity | undefined = route.params?.activity;
  const isEditMode = !!existingActivity;
  const remixSource: Activity | undefined = route.params?.remixFrom;
  const isRemixMode = !isEditMode && !!remixSource;
  const aiGenerated: any = route.params?.aiGenerated;
  const isAIMode = !!aiGenerated;

  // Editing and remixing start from the same place — an activity that already
  // exists — so every field below prefills from `source`. What separates them is
  // only what happens on publish: an edit updates, a remix creates.
  const source: Activity | undefined = existingActivity ?? remixSource;
  const hasSource = !!source;
  const draft: DraftActivity = route.params?.draft ?? { description: '', timing: '', materials: '', tips: '' };

  const duration = isAIMode ? aiGenerated.duration_minutes : hasSource ? source!.duration_minutes : parseDuration(draft.timing);
  const ageInfo = isAIMode ? { min: aiGenerated.min_age, max: aiGenerated.max_age } : hasSource ? { min: source!.min_age, max: source!.max_age } : parseAge(draft.timing);

  const [title, setTitle] = useState(
    isAIMode ? aiGenerated.title : hasSource ? source!.title : generateSmartTitle(draft.description)
  );
  const [description, setDescription] = useState(
    isAIMode ? aiGenerated.description : hasSource ? source!.description : draft.description
  );
  const [durationVal, setDurationVal] = useState(String(duration));
  const [minAge, setMinAge] = useState(String(ageInfo.min));
  const [maxAge, setMaxAge] = useState(ageInfo.max ? String(ageInfo.max) : '');
  const [materials, setMaterials] = useState<EditableMaterial[]>(
    isAIMode ? aiGenerated.materials.map((m: any) => ({ name: m.name, buy_hint: m.buy_hint ?? '', amazon_url: m.amazon_url ?? null }))
    : hasSource ? source!.materials.map(m => ({ name: m.name, buy_hint: (m as any).buy_hint ?? getBuyHint(m.name), amazon_url: (m as any).amazon_url ?? null }))
    : parseMaterials(draft.materials)
  );
  const [steps, setSteps] = useState<EditableStep[]>(
    isAIMode ? aiGenerated.steps.map((s: any) => ({ ...s, images: s.images ?? [] }))
    : hasSource
      ? source!.steps.map(s => ({ ...s, images: ((s as any).images ?? []) as string[] }))
      : parseSteps(draft.steps, draft.description, duration, draft.materials).map(s => ({ ...s, images: [] as string[] }))
  );
  const [tips, setTips] = useState<string[]>(
    isAIMode ? (aiGenerated.tips ?? []) : hasSource ? source!.tips : parseTips(draft.tips)
  );
  const [objectives, setObjectives] = useState<string[]>(
    isAIMode ? aiGenerated.objectives : hasSource ? source!.objectives : generateObjectives(draft.description)
  );
  const [videoUrl, setVideoUrl] = useState(
    isAIMode ? (aiGenerated.video_url ?? '') : hasSource ? (source!.video_url ?? '') : ''
  );
  // The cover the screen opened with (the AI's pick, or the activity's own when
  // editing or remixing), kept so a change or removal can be undone.
  const [originalFeaturedImage] = useState<string | null>(
    isAIMode ? (aiGenerated.featured_image_url ?? null) : hasSource ? (source!.featured_image_url ?? null) : null
  );
  const [featuredImage, setFeaturedImage] = useState<string | null>(originalFeaturedImage);
  const canRestoreCover = !!originalFeaturedImage && featuredImage !== originalFeaturedImage;
  const [uploadingFeatured, setUploadingFeatured] = useState(false);
  const [uploadingStepIdx, setUploadingStepIdx] = useState<number | null>(null);
  const [category, setCategory] = useState<Category>(
    isAIMode ? (aiGenerated.category ?? detectCategory(aiGenerated.description, []))
    : hasSource ? (source!.category ?? detectCategory(source!.description, source!.tags))
    : detectCategory(draft.description, [])
  );
  const [loading, setLoading] = useState(false);

  const addMaterial = () => setMaterials(prev => [...prev, { name: '', buy_hint: '', amazon_url: null }]);
  const removeMaterial = (i: number) => setMaterials(prev => prev.filter((_, idx) => idx !== i));
  const updateMaterial = (i: number, updated: typeof materials[0]) =>
    setMaterials(prev => prev.map((m, idx) => idx === i ? updated : m));

  const addStep = () => setSteps(prev => [...prev, {
    number: prev.length + 1, title: '', description: '', duration_minutes: 10, tip: undefined, images: [],
  }]);
  const removeStep = (i: number) => setSteps(prev =>
    prev.filter((_, idx) => idx !== i).map((s, idx) => ({ ...s, number: idx + 1 }))
  );
  const updateStep = (i: number, updated: typeof steps[0]) =>
    setSteps(prev => prev.map((s, idx) => idx === i ? updated : s));

  const handleAddFeaturedImage = async () => {
    setUploadingFeatured(true);
    try {
      const url = await pickAndUploadImage(COVER_ASPECT);
      if (url) setFeaturedImage(url);
    } finally {
      setUploadingFeatured(false);
    }
  };

  const handleAddStepImage = async (stepIdx: number) => {
    setUploadingStepIdx(stepIdx);
    try {
      const url = await pickAndUploadImage();
      if (url) {
        setSteps(prev => prev.map((s, i) =>
          i === stepIdx ? { ...s, images: [...s.images, url] } : s
        ));
      }
    } finally {
      setUploadingStepIdx(null);
    }
  };

  const handleRemoveStepImage = (stepIdx: number, imgIdx: number) => {
    setSteps(prev => prev.map((s, i) =>
      i === stepIdx ? { ...s, images: s.images.filter((_, j) => j !== imgIdx) } : s
    ));
  };

  const addTip = () => setTips(prev => [...prev, '']);
  const removeTip = (i: number) => setTips(prev => prev.filter((_, idx) => idx !== i));
  const updateTip = (i: number, val: string) => setTips(prev => prev.map((t, idx) => idx === i ? val : t));

  const addObjective = () => setObjectives(prev => [...prev, '']);
  const removeObjective = (i: number) => setObjectives(prev => prev.filter((_, idx) => idx !== i));
  const updateObjective = (i: number, val: string) =>
    setObjectives(prev => prev.map((o, idx) => idx === i ? val : o));

  const handleSaveDraft = async () => {
    try {
      const draftData = {
        title,
        description,
        durationVal,
        minAge,
        maxAge,
        materials,
        steps,
        tips,
        objectives,
        videoUrl,
        savedAt: new Date().toISOString(),
      };
      await AsyncStorage.setItem('activity_draft', JSON.stringify(draftData));
      Alert.alert('Draft saved', 'You can continue editing this activity later.');
    } catch {
      Alert.alert('Error', 'Could not save draft. Please try again.');
    }
  };

  const handlePublish = async () => {
    if (!title.trim()) {
      Alert.alert('Missing title', 'Please add a title for your activity.');
      return;
    }
    if (materials.some(m => !m.name.trim())) {
      Alert.alert('Empty material', 'Please fill in all material names or remove empty ones.');
      return;
    }

    const payload: Partial<Activity> = {
      title: title.trim(),
      description: description.trim(),
      duration_minutes: parseInt(durationVal) || 60,
      min_age: parseInt(minAge) || 8,
      materials: materials.filter(m => m.name.trim()),
      steps,
      tips: tips.filter(t => t.trim()),
      objectives: objectives.filter(o => o.trim()),
      category,
      ...(maxAge ? { max_age: parseInt(maxAge) } : { max_age: null }),
      ...(featuredImage ? { featured_image_url: featuredImage } : {}),
      ...(videoUrl.trim() ? { video_url: videoUrl.trim() } : {}),
    };

    if (isRemixMode && !remixDiffersFromSource(remixSource!, {
      title, description, durationVal, minAge, maxAge,
      materials, steps, tips, objectives,
    })) {
      Alert.alert(
        'Nothing changed yet',
        `This is still identical to "${remixSource!.title}". Change the steps, materials, timing or age range so other educators can see how your version differs.`,
      );
      return;
    }

    setLoading(true);
    try {
      if (isEditMode) {
        const updated = await updateActivity(existingActivity!.id, payload);
        Alert.alert(
          'Changes saved ✅',
          'Your activity has been updated.',
          [
            {
              text: 'View Activity',
              onPress: () => navigation.navigate('HomeTab', {
                screen: 'ActivityDetail',
                params: { activityId: updated.id, activity: updated },
              }),
            },
            { text: 'Done', onPress: () => navigation.goBack() },
          ]
        );
      } else {
        const base = { ...payload, language: 'en', is_featured: false, tags: [] };
        const newActivity = isRemixMode
          ? await createRemix(remixSource!, base)
          : await createActivity(base);
        await trackActivityCreation(newActivity.id);
        if (isRemixMode) {
          await trackRemix(newActivity.id, remixSource!.id);
          sendPushToUser(remixSource!.created_by, newActivity.created_by, {
            title: 'Your activity was remixed',
            body: `Someone published their own version of "${remixSource!.title}".`,
            data: { type: 'remix', activity_id: newActivity.id },
          });
        }
        // Local confirmation to the author that their own activity is live.
        notifyActivityPublished(newActivity.title);
        Alert.alert(
          isRemixMode ? 'Remix published! 🎉' : 'Published! 🎉',
          isRemixMode
            ? `Your version is live and credits "${remixSource!.title}" as the original.`
            : 'Your activity is now live on ZubHub. Educators can discover and download it.',
          [
            {
              text: 'View Activity',
              onPress: () => navigation.navigate('HomeTab', {
                screen: 'ActivityDetail',
                params: { activityId: newActivity.id, activity: newActivity },
              }),
            },
            { text: 'Go Home', onPress: () => navigation.navigate('HomeTab') },
          ]
        );
      }
    } catch (err: any) {
      console.warn('[Activity] save failed:', err?.code ?? err?.message ?? err);
      Alert.alert('Could not save', 'Please try again in a moment.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#E53E3E', '#ED64A6']} style={styles.header} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
          <SafeAreaView edges={['top']}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
              <Ionicons name="arrow-back" size={24} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {isEditMode ? 'Edit Activity ✏️' : isRemixMode ? 'Remix Activity 🔀' : 'Review Your Activity ✅'}
            </Text>
            <Text style={styles.headerSub}>
              {isEditMode
                ? 'Update your activity details'
                : isRemixMode
                  ? 'Make it yours. The original stays untouched'
                  : 'AI-structured • Edit everything!'}
            </Text>
          </SafeAreaView>
        </LinearGradient>

        <View style={styles.body}>
          {/* Banner */}
          {isRemixMode ? (
            <View style={styles.editBanner}>
              <View style={styles.editBannerIcon}>
                <Ionicons name="git-branch-outline" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.editBannerTitle} numberOfLines={2}>
                  Remixing "{remixSource!.title}"
                </Text>
                <Text style={styles.editBannerSub}>
                  Publishes as a new activity that credits the original
                </Text>
              </View>
            </View>
          ) : isEditMode ? (
            <View style={styles.editBanner}>
              <View style={styles.editBannerIcon}>
                <Ionicons name="create-outline" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.editBannerTitle}>Editing your activity</Text>
                <Text style={styles.editBannerSub}>All fields are editable. Save when you're done</Text>
              </View>
            </View>
          ) : (
            <View style={styles.successBanner}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.successTitle}>Structured in seconds! 🎉</Text>
                <Text style={styles.successSub}>Tap any field to edit • All sections are fully editable</Text>
              </View>
            </View>
          )}

          {/* Title */}
          <Card label="TITLE">
            <TextInput
              style={styles.titleInput}
              value={title}
              onChangeText={setTitle}
              placeholder="Activity title..."
              placeholderTextColor="#A0AEC0"
              multiline
            />
          </Card>

          {/* Category */}
          <Card label="CATEGORY">
            <Text style={styles.categoryHint}>Auto-detected. Tap to change</Text>
            <View style={styles.categoryChips}>
              {CATEGORIES.map((cat) => {
                const active = category === cat.id;
                return (
                  <TouchableOpacity
                    key={cat.id}
                    style={[styles.categoryChip, active && { backgroundColor: cat.color, borderColor: cat.color }]}
                    onPress={() => setCategory(cat.id)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name={cat.icon as any} size={13} color={active ? '#fff' : cat.color} />
                    <Text style={[styles.categoryChipText, active && { color: '#fff' }]}>{cat.id}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </Card>

          {/* Description */}
          <Card label="DESCRIPTION">
            <TextInput
              style={styles.descInput}
              value={description}
              onChangeText={setDescription}
              placeholder="Describe the activity..."
              placeholderTextColor="#A0AEC0"
              multiline
              numberOfLines={3}
            />
          </Card>

          {/* Details */}
          <Card label="DETAILS">
            <View style={styles.detailsGrid}>
              <View style={styles.detailField}>
                <Text style={styles.detailFieldLabel}>Duration (min)</Text>
                <TextInput
                  style={styles.detailFieldInput}
                  value={durationVal}
                  onChangeText={setDurationVal}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.detailField}>
                <Text style={styles.detailFieldLabel}>Min Age</Text>
                <TextInput
                  style={styles.detailFieldInput}
                  value={minAge}
                  onChangeText={setMinAge}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.detailField}>
                <Text style={styles.detailFieldLabel}>Max Age</Text>
                <TextInput
                  style={styles.detailFieldInput}
                  value={maxAge}
                  onChangeText={setMaxAge}
                  keyboardType="numeric"
                  placeholder="Any"
                  placeholderTextColor="#A0AEC0"
                />
              </View>
            </View>
          </Card>

          {/* Objectives */}
          <Card label="OBJECTIVES 🎯" onAdd={addObjective}>
            {objectives.map((obj, i) => (
              <EditableListItem
                key={i}
                value={obj}
                onChangeText={(v) => updateObjective(i, v)}
                onRemove={() => removeObjective(i)}
                placeholder="e.g. Learn circuit basics"
              />
            ))}
            {objectives.length === 0 && (
              <Text style={styles.emptyHint}>Tap Add to add an objective</Text>
            )}
          </Card>

          {/* Materials */}
          <Card label="MATERIALS 📦" onAdd={addMaterial}>
            {materials.map((m, i) => (
              <EditableMaterial
                key={i}
                item={m}
                onChange={(updated) => updateMaterial(i, updated)}
                onRemove={() => removeMaterial(i)}
              />
            ))}
            {materials.length === 0 && (
              <Text style={styles.emptyHint}>Tap Add to add a material</Text>
            )}
          </Card>

          {/* Steps */}
          <Card label="STEPS (AI GENERATED, EDIT FREELY) 📋" onAdd={addStep}>
            {steps.map((s, i) => (
              <EditableStep
                key={i}
                step={s}
                onChange={(updated) => updateStep(i, updated)}
                onRemove={() => removeStep(i)}
                onAddImage={() => handleAddStepImage(i)}
                onRemoveImage={(imgIdx) => handleRemoveStepImage(i, imgIdx)}
                uploading={uploadingStepIdx === i}
              />
            ))}
            {steps.length === 0 && (
              <Text style={styles.emptyHint}>Tap Add to add a step</Text>
            )}
          </Card>

          {/* Add Media */}
          <View style={styles.mediaCard}>
            <View style={styles.mediaHeader}>
              <Ionicons name="images-outline" size={18} color="#6B46C1" />
              <Text style={styles.mediaTitle}>Media (optional)</Text>
            </View>

            {/* Featured image */}
            <Text style={styles.mediaLabel}>Cover Photo</Text>
            {featuredImage ? (
              <View style={styles.featuredWrap}>
                <Image source={{ uri: featuredImage }} style={styles.featuredImage} />
                <TouchableOpacity style={styles.featuredRemove} onPress={() => setFeaturedImage(null)}>
                  <Ionicons name="close-circle" size={22} color="#E53E3E" />
                </TouchableOpacity>
                {/* The AI picks a cover from the uploaded photos without cropping,
                    so offer a way to choose and frame one. */}
                <TouchableOpacity
                  style={styles.featuredChange}
                  onPress={handleAddFeaturedImage}
                  disabled={uploadingFeatured}
                >
                  {uploadingFeatured ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <>
                      <Ionicons name="crop-outline" size={14} color="#fff" />
                      <Text style={styles.featuredChangeText}>Change & crop</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.featuredPicker}
                onPress={handleAddFeaturedImage}
                disabled={uploadingFeatured}
                activeOpacity={0.7}
              >
                {uploadingFeatured ? (
                  <ActivityIndicator color="#6B46C1" />
                ) : (
                  <>
                    <Ionicons name="camera-outline" size={28} color="#9F7AEA" />
                    <Text style={styles.featuredPickerText}>Add cover photo</Text>
                    <Text style={styles.featuredPickerSub}>Shown on activity cards</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {canRestoreCover && (
              <TouchableOpacity
                style={styles.restoreCover}
                onPress={() => setFeaturedImage(originalFeaturedImage)}
              >
                <Ionicons name="arrow-undo-outline" size={14} color="#6B46C1" />
                <Text style={styles.restoreCoverText}>Use original cover</Text>
              </TouchableOpacity>
            )}

            {/* Video URL */}
            <Text style={[styles.mediaLabel, { marginTop: 14 }]}>Demo Video</Text>
            <TextInput
              style={styles.mediaInput}
              placeholder="Paste YouTube or Vimeo link..."
              placeholderTextColor="#A0AEC0"
              value={videoUrl}
              onChangeText={setVideoUrl}
              autoCapitalize="none"
              keyboardType="url"
            />
          </View>

          {/* Actions */}
          <TouchableOpacity onPress={handlePublish} disabled={loading} activeOpacity={0.85}>
            <LinearGradient colors={['#E53E3E', '#ED64A6']} style={styles.publishBtn} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.publishText}>
                  {isEditMode ? 'Save Changes ✅' : isRemixMode ? 'Publish Remix 🔀' : 'Publish Activity 🎉'}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          {/* Drafts do not carry `remixFrom`, so offering one here would quietly
              drop the attribution when the draft is restored and published. */}
          {!isEditMode && !isRemixMode && (
            <TouchableOpacity style={styles.draftBtn} onPress={handleSaveDraft}>
              <Text style={styles.draftText}>Save as Draft</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F7FAFC' },
  header: { paddingHorizontal: 20, paddingBottom: 24 },
  back: { marginBottom: 12, marginTop: 8 },
  headerTitle: { fontSize: 22, fontWeight: '900', fontFamily: 'Raleway_800ExtraBold', color: '#fff', marginBottom: 4 },
  headerSub: { fontSize: 13, color: 'rgba(255,255,255,0.85)' },
  body: { padding: 16, gap: 12, paddingBottom: 40 },
  successBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#F0FFF4', borderWidth: 2, borderColor: '#9AE6B4',
    borderRadius: 14, padding: 14,
  },
  successIcon: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#38A169',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  successTitle: { fontSize: 14, fontWeight: '700', fontFamily: 'Raleway_700Bold', color: '#276749' },
  successSub: { fontSize: 11, color: '#48BB78', marginTop: 2 },
  editBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    backgroundColor: '#EBF4FF', borderWidth: 2, borderColor: '#90CDF4',
    borderRadius: 14, padding: 14,
  },
  editBannerIcon: {
    width: 36, height: 36, borderRadius: 18, backgroundColor: '#3182CE',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  editBannerTitle: { fontSize: 14, fontWeight: '700', fontFamily: 'Raleway_700Bold', color: '#2C5282' },
  editBannerSub: { fontSize: 11, color: '#63B3ED', marginTop: 2 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 14,
    elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4,
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10,
  },
  cardLabel: {
    fontSize: 11, fontWeight: '700', fontFamily: 'Raleway_700Bold', color: '#718096',
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  addBtnText: { fontSize: 13, color: '#E53E3E', fontWeight: '600', fontFamily: 'Raleway_600SemiBold' },
  titleInput: {
    fontSize: 18, fontWeight: '700', fontFamily: 'Raleway_700Bold', color: '#1A202C',
    borderWidth: 2, borderColor: '#E2E8F0', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
  },
  descInput: {
    fontSize: 14, color: '#1A202C', lineHeight: 20,
    borderWidth: 2, borderColor: '#E2E8F0', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, textAlignVertical: 'top',
  },
  detailsGrid: { flexDirection: 'row', gap: 8 },
  detailField: { flex: 1 },
  detailFieldLabel: { fontSize: 11, color: '#718096', marginBottom: 4 },
  detailFieldInput: {
    borderWidth: 2, borderColor: '#E2E8F0', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8, fontSize: 16, fontWeight: '700', fontFamily: 'Raleway_700Bold', color: '#1A202C', textAlign: 'center',
  },
  editableRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  editableInput: {
    flex: 1, borderWidth: 2, borderColor: '#E2E8F0', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 8, fontSize: 14, color: '#1A202C',
  },
  removeBtn: { padding: 2 },
  emptyHint: { fontSize: 13, color: '#A0AEC0', fontStyle: 'italic', textAlign: 'center', paddingVertical: 8 },
  // Material edit
  materialEditCard: {
    backgroundColor: '#F7FAFC', borderRadius: 10, padding: 10, marginBottom: 8,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  materialEditRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 },
  buyHintText: { fontSize: 11, color: '#718096', fontStyle: 'italic', marginBottom: 4 },
  urlInput: {
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 6, fontSize: 12, color: '#4A5568',
  },
  // Step edit
  stepEditCard: {
    backgroundColor: '#F7FAFC', borderRadius: 10, padding: 10, marginBottom: 8,
    borderWidth: 1, borderColor: '#E2E8F0',
  },
  stepEditHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  stepNum: {
    width: 26, height: 26, borderRadius: 13, backgroundColor: '#E53E3E',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  stepNumText: { color: '#fff', fontSize: 12, fontWeight: '700', fontFamily: 'Raleway_700Bold' },
  stepTitleInput: {
    flex: 1, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 6, fontSize: 14, fontWeight: '600', fontFamily: 'Raleway_600SemiBold', color: '#1A202C',
  },
  stepDurWrapper: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  stepDurInput: {
    width: 40, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 6,
    paddingHorizontal: 4, paddingVertical: 6, fontSize: 13, color: '#718096', textAlign: 'center',
  },
  stepDurLabel: { fontSize: 11, color: '#718096' },
  stepDescInput: {
    borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 6,
    paddingHorizontal: 8, paddingVertical: 6, fontSize: 13, color: '#4A5568',
    marginBottom: 6, textAlignVertical: 'top',
  },
  stepTipRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 6,
    backgroundColor: '#FFFBEB', borderRadius: 6, padding: 8, marginTop: 8,
    borderWidth: 1, borderColor: '#FDE68A',
  },
  stepTipInput: {
    flex: 1, fontSize: 12, color: '#92400E', lineHeight: 17,
    padding: 0, margin: 0,
  },
  activityTipHint: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 4,
    backgroundColor: '#FFFDF5', paddingHorizontal: 8, paddingVertical: 6,
    borderRadius: 4, marginBottom: 6,
  },
  activityTipHintText: { fontSize: 11, color: '#B7791F', flex: 1, lineHeight: 16 },
  // Step images
  stepImageRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, flexWrap: 'wrap' },
  stepThumbWrap: { position: 'relative' },
  stepThumb: { width: 72, height: 54, borderRadius: 6, backgroundColor: '#E2E8F0' },
  stepThumbRemove: { position: 'absolute', top: -6, right: -6 },
  stepAddImageBtn: {
    width: 72, height: 54, borderRadius: 6,
    borderWidth: 1.5, borderColor: '#CBD5E0', borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center', gap: 2,
  },
  stepAddImageText: { fontSize: 10, color: '#718096' },
  // Media
  mediaCard: {
    backgroundColor: '#FAF5FF', borderWidth: 2, borderColor: '#D6BCFA',
    borderRadius: 14, padding: 14,
  },
  mediaHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  mediaTitle: { fontSize: 14, fontWeight: '700', fontFamily: 'Raleway_700Bold', color: '#553C9A' },
  mediaLabel: { fontSize: 11, fontWeight: '700', fontFamily: 'Raleway_700Bold', color: '#718096', textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 8 },
  featuredPicker: {
    borderWidth: 2, borderColor: '#D6BCFA', borderStyle: 'dashed', borderRadius: 12,
    paddingVertical: 24, alignItems: 'center', gap: 6, backgroundColor: '#fff',
  },
  featuredPickerText: { fontSize: 14, fontWeight: '600', fontFamily: 'Raleway_600SemiBold', color: '#553C9A' },
  featuredPickerSub: { fontSize: 11, color: '#9F7AEA' },
  restoreCover: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    alignSelf: 'flex-start', marginTop: 8, paddingVertical: 4,
  },
  restoreCoverText: { fontSize: 13, fontWeight: '600', color: '#6B46C1' },
  featuredWrap: { position: 'relative', borderRadius: 12, overflow: 'hidden' },
  featuredImage: { width: '100%', aspectRatio: 16 / 9, borderRadius: 12 },
  featuredChange: {
    position: 'absolute', bottom: 8, right: 8,
    flexDirection: 'row', alignItems: 'center', gap: 4,
    backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 14,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  featuredChangeText: { fontSize: 12, fontWeight: '600', color: '#fff' },
  featuredRemove: { position: 'absolute', top: 8, right: 8, backgroundColor: '#fff', borderRadius: 12 },
  mediaInput: {
    borderWidth: 2, borderColor: '#D6BCFA', borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14, color: '#1A202C',
    backgroundColor: '#fff',
  },
  categoryHint: { fontSize: 11, color: '#A0AEC0', fontStyle: 'italic', marginBottom: 10 },
  categoryChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 6, backgroundColor: '#F7FAFC',
  },
  categoryChipText: { fontSize: 12, fontWeight: '600', fontFamily: 'Raleway_600SemiBold', color: '#4A5568' },
  publishBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  publishText: { color: '#fff', fontSize: 17, fontWeight: '700', fontFamily: 'Raleway_700Bold' },
  draftBtn: {
    borderWidth: 2, borderColor: '#E2E8F0', borderRadius: 14,
    paddingVertical: 14, alignItems: 'center',
  },
  draftText: { fontSize: 15, color: '#4A5568', fontWeight: '600', fontFamily: 'Raleway_600SemiBold' },
});
