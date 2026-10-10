import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Image, TouchableOpacity,
  ActivityIndicator, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing, BorderRadius } from '../theme';
import { PendingPhoto } from '../hooks/usePhotoUpload';

/**
 * Thumbnail row for photos attached to a note, showing upload state per photo.
 * A failed upload stays on screen and offers a retry instead of disappearing —
 * silently dropping a photo is how the old flow lost them.
 *
 * Tapping a thumbnail opens a caption field for it. Captions are deliberately
 * not prompted for: an educator packing up after a session will not name a
 * dozen photos, and the note text already describes the batch.
 */
export default function PhotoStrip({
  photos,
  onRemove,
  onRetry,
  onCaptionChange,
  onAddMore,
}: {
  photos: PendingPhoto[];
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
  onCaptionChange?: (id: string, caption: string) => void;
  /** Renders a `+` tile at the end, so adding more needs no second button. */
  onAddMore?: () => void;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  if (photos.length === 0) return null;

  const selected = photos.find((p) => p.id === selectedId) ?? null;

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.row}>
        {photos.map((photo) => {
          const isSelected = photo.id === selectedId;
          return (
            <View key={photo.id} style={styles.thumb}>
              <TouchableOpacity
                activeOpacity={onCaptionChange ? 0.8 : 1}
                disabled={!onCaptionChange}
                onPress={() => setSelectedId(isSelected ? null : photo.id)}
              >
                <Image
                  source={{ uri: photo.localUri }}
                  style={[styles.img, isSelected && styles.imgSelected]}
                />
              </TouchableOpacity>

              {photo.status === 'uploading' && (
                <View style={styles.overlay} pointerEvents="none">
                  <ActivityIndicator color="#fff" size="small" />
                </View>
              )}

              {photo.status === 'failed' && (
                <TouchableOpacity style={styles.overlay} onPress={() => onRetry(photo.id)}>
                  <Ionicons name="refresh" size={20} color="#fff" />
                  <Text style={styles.retryText}>Retry</Text>
                </TouchableOpacity>
              )}

              {/* A caption is easy to forget once the field is closed again. */}
              {photo.caption?.trim() ? (
                <View style={styles.captionDot} pointerEvents="none">
                  <Ionicons name="text" size={10} color="#fff" />
                </View>
              ) : null}

              <TouchableOpacity
                style={styles.remove}
                onPress={() => {
                  if (selectedId === photo.id) setSelectedId(null);
                  onRemove(photo.id);
                }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Ionicons name="close-circle" size={20} color={Colors.error} />
              </TouchableOpacity>
            </View>
          );
        })}

        {onAddMore && (
          <TouchableOpacity style={styles.addTile} onPress={onAddMore} activeOpacity={0.7}>
            <Ionicons name="add" size={26} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </ScrollView>

      {selected && onCaptionChange && (
        <View style={styles.captionBox}>
          <TextInput
            style={styles.captionInput}
            value={selected.caption ?? ''}
            onChangeText={(text) => onCaptionChange(selected.id, text)}
            placeholder="Add a caption (optional)"
            placeholderTextColor="#A0AEC0"
            maxLength={80}
            returnKeyType="done"
            onSubmitEditing={() => setSelectedId(null)}
          />
          <TouchableOpacity
            onPress={() => setSelectedId(null)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="checkmark" size={18} color="#3182CE" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { marginTop: Spacing.md, marginBottom: Spacing.xs },
  thumb: { position: 'relative', marginRight: Spacing.sm },
  img: {
    width: 80, height: 80,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.border,
  },
  addTile: {
    width: 80, height: 80,
    borderRadius: BorderRadius.sm,
    borderWidth: 1.5, borderColor: Colors.border, borderStyle: 'dashed',
    alignItems: 'center', justifyContent: 'center',
  },
  imgSelected: {
    borderWidth: 2,
    borderColor: '#3182CE',
  },
  overlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    borderRadius: BorderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  retryText: {
    color: '#fff', fontSize: FontSize.xs,
    fontWeight: '700', fontFamily: 'Raleway_700Bold',
  },
  captionDot: {
    position: 'absolute', bottom: 4, left: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: BorderRadius.full,
    padding: 3,
  },
  remove: {
    position: 'absolute', top: -6, right: -6,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.full,
  },
  captionBox: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    borderWidth: 1.5, borderColor: '#E2E8F0', borderRadius: 10,
    backgroundColor: '#F7FAFC',
    paddingHorizontal: 12, paddingVertical: 8,
    marginBottom: Spacing.xs,
  },
  captionInput: {
    flex: 1, fontSize: 13, color: '#1A202C', padding: 0,
  },
});
