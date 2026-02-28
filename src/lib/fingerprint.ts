export async function generateFingerprint(): Promise<string> {
  const components: string[] = [];

  // Screen
  components.push(`${screen.width}x${screen.height}x${screen.colorDepth}`);

  // Timezone
  components.push(Intl.DateTimeFormat().resolvedOptions().timeZone);

  // Language
  components.push(navigator.language);

  // Platform
  components.push(navigator.platform);

  // Canvas fingerprint
  try {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.textBaseline = 'top';
      ctx.font = '14px Arial';
      ctx.fillText('VoiceBoard fingerprint', 2, 2);
      components.push(canvas.toDataURL().slice(-50));
    }
  } catch {
    // Canvas not available
  }

  // Hash the components
  const raw = components.join('|');
  const encoder = new TextEncoder();
  const data = encoder.encode(raw);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const FINGERPRINT_KEY = 'vb_fingerprint';

export async function getOrCreateFingerprint(): Promise<string> {
  if (typeof window === 'undefined') return '';

  const stored = localStorage.getItem(FINGERPRINT_KEY);
  if (stored) return stored;

  const fp = await generateFingerprint();
  localStorage.setItem(FINGERPRINT_KEY, fp);
  return fp;
}
