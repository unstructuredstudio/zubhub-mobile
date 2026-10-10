/**
 * Download service — generates a PDF from activity data and saves it
 * to the device's file system using expo-print + expo-file-system.
 *
 * Optimized for low-bandwidth: images are optional and the PDF is kept
 * small by using simple HTML layout.
 */

import * as Print from 'expo-print';
import * as FileSystem from 'expo-file-system/legacy';
import { APP_DOMAIN } from './share';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';
import { Activity } from '../types';
import { trackDownload } from './analytics';

export interface DownloadProgress {
  stage: 'generating' | 'saving' | 'done' | 'error';
  percent: number;
  message: string;
}

type ProgressCallback = (progress: DownloadProgress) => void;

// ─── HTML Template ────────────────────────────────────────────────────────────

function buildActivityHtml(activity: Activity): string {
  const materialsHtml = (activity.materials ?? [])
    .map(
      (m) =>
        `<li class="material-item">
          <span class="material-name">${escapeHtml(m.name)}</span>
          ${m.price ? `<span class="price">${escapeHtml(m.price)}</span>` : ''}
        </li>`
    )
    .join('');

  const activityTips = activity.tips ?? [];
  const stepsHtml = (activity.steps ?? [])
    .map(
      (s, idx) => {
        // Use step-level tip first, fall back to activity-level tip for this step index
        const tip = s.tip || activityTips[idx] || '';
        return `<div class="step">
          <div class="step-header">
            <span class="step-number">${s.number}</span>
            <div class="step-info">
              <strong>${escapeHtml(s.title)}</strong>
              <span class="step-time">${s.duration_minutes} min</span>
            </div>
          </div>
          <p class="step-desc">${escapeHtml(s.description)}</p>
          ${
            tip
              ? `<div class="tip"><span class="tip-icon">💡</span> <strong>Facilitation Tip:</strong> ${escapeHtml(tip)}</div>`
              : ''
          }
          ${
            s.images?.length
              ? `<div class="step-images">${s.images.map((url: string) => `<img src="${escapeHtml(url)}" class="step-img" />`).join('')}</div>`
              : ''
          }
        </div>`;
      }
    )
    .join('');

  const objectivesHtml = (activity.objectives ?? [])
    .map((o) => `<li>${escapeHtml(o)}</li>`)
    .join('');

  const ageRange = activity.max_age
    ? `Ages ${activity.min_age}–${activity.max_age}`
    : `Ages ${activity.min_age}+`;

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>${escapeHtml(activity.title)} | ZubHub</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    font-family: Arial, Helvetica, sans-serif;
    font-size: 14px;
    color: #111827;
    background: #fff;
    padding: 24px;
    max-width: 600px;
  }
  .header {
    padding-bottom: 20px;
    margin-bottom: 20px;
    border-bottom: 2px solid #E2E8F0;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .logo { height: 28px; }
  .header h1 { font-size: 22px; font-weight: 900; margin-bottom: 6px; color: #111827; }
  .header p { font-size: 14px; color: #111827; font-weight: 500; line-height: 1.6; }
  .meta { display: flex; gap: 12px; margin-top: 10px; font-size: 12px; font-weight: 600; }
  .meta span { background: #F7FAFC; border: 1px solid #E2E8F0; padding: 3px 8px; border-radius: 20px; color: #374151; }
  .zubhub-brand { font-size: 11px; color: #E53E3E; margin-top: 8px; font-weight: 600; }

  .section { margin-bottom: 20px; }
  .section-title {
    font-size: 14px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: #111827;
    margin-bottom: 10px;
    padding-bottom: 4px;
    border-bottom: 2px solid #E2E8F0;
  }
  .description { line-height: 1.6; color: #111827; font-size: 14px; font-weight: 500; }

  ul.materials { list-style: none; }
  li.material-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 0;
    border-bottom: 1px solid #F0F4F8;
  }
  .material-name { flex: 1; color: #111827; }
  .price { font-size: 11px; color: #374151; }

  .step {
    background: #F7FAFC;
    border-radius: 8px;
    padding: 12px;
    margin-bottom: 10px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .step-header { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
  .step-number {
    width: 28px; height: 28px;
    background: #E53E3E;
    color: white;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 13px;
    flex-shrink: 0;
  }
  .step-info { flex: 1; }
  .step-time { font-size: 11px; color: #374151; margin-left: 8px; }
  .step-desc { color: #111827; line-height: 1.5; }
  .tip {
    background: #FFFBEB;
    border-left: 3px solid #F6AD55;
    padding: 8px 10px;
    border-radius: 0 6px 6px 0;
    margin-top: 8px;
    font-size: 12px;
    color: #744210;
  }

  ul.tips, ul.objectives { padding-left: 16px; }
  ul.tips li, ul.objectives li { padding: 4px 0; line-height: 1.5; color: #111827; }

  .footer {
    margin-top: 24px;
    padding-top: 16px;
    border-top: 2px solid #E2E8F0;
    font-size: 12px;
    color: #374151;
    text-align: center;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .footer-brand { margin-bottom: 4px; }
  .footer-brand img { height: 24px; }
  .footer-sub { margin-top: 4px; color: #4B5563; }
  .footer-dev { margin-top: 6px; font-size: 11px; color: #6B7280; }

  .featured-img {
    width: 100%;
    max-height: 280px;
    object-fit: cover;
    border-radius: 8px;
    margin-bottom: 16px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .step-images {
    display: flex;
    gap: 8px;
    margin-top: 8px;
    flex-wrap: wrap;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .step-img {
    width: 140px;
    height: 105px;
    object-fit: cover;
    border-radius: 6px;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .video-section {
    background: #1A202C;
    color: white;
    padding: 14px 16px;
    border-radius: 8px;
    margin-bottom: 16px;
    text-decoration: none;
    display: block;
    page-break-inside: avoid;
    break-inside: avoid;
  }
  .video-section a { color: #63B3ED; text-decoration: underline; }
  .video-label { font-size: 12px; font-weight: 700; margin-bottom: 4px; }
  .video-url { font-size: 11px; color: #A0AEC0; word-break: break-all; }
</style>
</head>
<body>
<div class="header">
  <h1>${escapeHtml(activity.title)}</h1>
  <p>${escapeHtml(activity.description)}</p>
  <div class="meta">
    <span>⏱ ${activity.duration_minutes} min</span>
    <span>👥 ${ageRange}</span>
    ${activity.group_size_max ? `<span>📋 Up to ${activity.group_size_max} participants</span>` : ''}
  </div>
</div>

${activity.featured_image_url ? `<img src="${escapeHtml(activity.featured_image_url)}" class="featured-img" />` : ''}

${activity.video_url ? `<div class="video-section"><div class="video-label">🎬 Activity Video</div><a href="${escapeHtml(activity.video_url)}">${escapeHtml(activity.video_url)}</a></div>` : ''}

${
  (activity.objectives ?? []).length > 0
    ? `<div class="section">
        <div class="section-title">Objectives</div>
        <ul class="objectives">${objectivesHtml}</ul>
      </div>`
    : ''
}

<div class="section">
  <div class="section-title">About this Activity</div>
  <p class="description">${escapeHtml(activity.description)}</p>
</div>

${
  (activity.materials ?? []).length > 0
    ? `<div class="section">
        <div class="section-title">Materials Needed</div>
        <ul class="materials">${materialsHtml}</ul>
      </div>`
    : ''
}

${
  (activity.steps ?? []).length > 0
    ? `<div class="section">
        <div class="section-title">Step-by-Step Guide</div>
        ${stepsHtml}
      </div>`
    : ''
}

<div class="footer">
  <div class="footer-brand"><img src="data:image/png;base64,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" class="logo" alt="ZubHub" /></div>
  <div class="footer-sub">Created by ${escapeHtml(activity.creator_name ?? 'Educator')}</div>
  <div class="footer-sub">Share this activity to help other educators!</div>
  <div class="footer-dev">${escapeHtml(APP_DOMAIN)} &bull; Open-source platform for creative learning</div>
  <div class="footer-dev">Activity developed by Unstructured Studio</div>
</div>
</body>
</html>`;
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ─── Main Download Function ───────────────────────────────────────────────────

export async function downloadActivityPDF(
  activity: Activity,
  onProgress?: ProgressCallback
): Promise<string | null> {
  try {
    onProgress?.({ stage: 'generating', percent: 10, message: 'Building PDF...' });

    const html = buildActivityHtml(activity);

    onProgress?.({ stage: 'generating', percent: 40, message: 'Generating PDF...' });

    const { uri: tempUri } = await Print.printToFileAsync({
      html,
      margins: { top: 32, bottom: 32, left: 16, right: 16 },
    });

    onProgress?.({ stage: 'saving', percent: 70, message: 'Saving file...' });

    // Move to a permanent location
    const fileName = `${activity.title.replace(/[^a-z0-9]/gi, '_')}.pdf`;
    const destDir = FileSystem.documentDirectory!;
    const destUri = `${destDir}${fileName}`;

    await FileSystem.moveAsync({ from: tempUri, to: destUri });

    onProgress?.({ stage: 'done', percent: 100, message: 'Download complete!' });

    // Track engagement
    await trackDownload(activity.id);

    return destUri;
  } catch (err) {
    console.error('[Download] Failed:', err);
    onProgress?.({ stage: 'error', percent: 0, message: 'Download failed.' });
    return null;
  }
}

export async function openOrSharePDF(uri: string): Promise<void> {
  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(uri, {
      mimeType: 'application/pdf',
      dialogTitle: 'Open or share your activity PDF',
      UTI: 'com.adobe.pdf',
    });
  } else {
    Alert.alert(
      'File saved',
      `Your activity PDF has been saved to: ${uri}`,
      [{ text: 'OK' }]
    );
  }
}

export function getEstimatedFileSize(activity: Activity): string {
  // Images in PDFs are large (~2-4MB each uncompressed)
  let mb = 0.5; // base PDF
  const stepImages = (activity.steps ?? []).reduce((sum, s) => sum + (s.images?.length ?? 0), 0);
  const totalImages = stepImages + (activity.featured_image_url ? 1 : 0);
  mb += totalImages * 3; // ~3MB per embedded image
  return mb < 1 ? `~${Math.ceil(mb * 1024)} KB` : `~${Math.ceil(mb)} MB`;
}
