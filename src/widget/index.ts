import { createStyles } from './styles';
import { createFingerprintForWidget } from './fingerprint';

interface VoiceBoardConfig {
  projectId: string;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
  theme?: 'light' | 'dark' | 'auto';
  accentColor?: string;
  triggerText?: string;
  apiBase?: string;
}

const VoiceBoard = {
  _container: null as HTMLDivElement | null,
  _shadow: null as ShadowRoot | null,
  _config: null as VoiceBoardConfig | null,

  init(config: VoiceBoardConfig) {
    this._config = {
      position: 'bottom-right',
      theme: 'light',
      accentColor: '#6366f1',
      triggerText: 'Feedback',
      apiBase: '',
      ...config,
    };

    if (!config.projectId) {
      console.error('[VoiceBoard] projectId is required');
      return;
    }

    // Detect API base from script src
    if (!this._config.apiBase) {
      const scripts = document.querySelectorAll('script[src*="widget"]');
      for (const script of scripts) {
        const src = (script as HTMLScriptElement).src;
        if (src.includes('voiceboard') || src.includes('widget')) {
          try {
            const url = new URL(src);
            this._config.apiBase = url.origin;
          } catch { /* ignore */ }
        }
      }
    }

    this._mount();
  },

  _mount() {
    // Create container
    this._container = document.createElement('div');
    this._container.id = 'voiceboard-widget';
    document.body.appendChild(this._container);

    // Create shadow DOM for style isolation
    this._shadow = this._container.attachShadow({ mode: 'open' });

    // Inject styles
    const styleEl = document.createElement('style');
    styleEl.textContent = createStyles(this._config!.accentColor!, this._config!.position!);
    this._shadow.appendChild(styleEl);

    // Create trigger button
    const trigger = document.createElement('button');
    trigger.className = 'vb-trigger';
    trigger.textContent = this._config!.triggerText!;
    trigger.addEventListener('click', () => this._toggleModal());
    this._shadow.appendChild(trigger);

    // Create modal (hidden by default)
    const modal = document.createElement('div');
    modal.className = 'vb-modal vb-hidden';
    modal.innerHTML = `
      <div class="vb-modal-header">
        <span class="vb-modal-title">フィードバックを送る</span>
        <button class="vb-close">&times;</button>
      </div>
      <form class="vb-form">
        <input type="text" class="vb-input" name="title" placeholder="何を改善してほしいですか？" required maxlength="200" />
        <textarea class="vb-textarea" name="description" placeholder="詳しい説明（任意）" rows="3" maxlength="2000"></textarea>
        <select class="vb-select" name="category">
          <option value="feature">機能要望</option>
          <option value="bug">バグ報告</option>
          <option value="improvement">改善提案</option>
        </select>
        <input type="email" class="vb-input" name="email" placeholder="メールアドレス（任意）" />
        <div class="vb-honeypot"><input type="text" name="website" tabindex="-1" autocomplete="off" /></div>
        <button type="submit" class="vb-submit">送信</button>
        <div class="vb-message vb-hidden"></div>
      </form>
      <div class="vb-powered">
        <a href="https://voiceboard.app" target="_blank" rel="noopener">Powered by VoiceBoard</a>
      </div>
    `;
    this._shadow.appendChild(modal);

    // Close button
    modal.querySelector('.vb-close')!.addEventListener('click', () => this._toggleModal());

    // Form submit
    modal.querySelector('.vb-form')!.addEventListener('submit', (e) => this._handleSubmit(e as SubmitEvent));
  },

  _toggleModal() {
    const modal = this._shadow!.querySelector('.vb-modal');
    if (modal) modal.classList.toggle('vb-hidden');
  },

  async _handleSubmit(e: SubmitEvent) {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);

    // Honeypot check
    if (formData.get('website')) return;

    const submitBtn = form.querySelector('.vb-submit') as HTMLButtonElement;
    const messageEl = form.parentElement!.querySelector('.vb-message') as HTMLDivElement;

    submitBtn.disabled = true;
    submitBtn.textContent = '送信中...';

    try {
      const fingerprint = await createFingerprintForWidget();
      const apiUrl = this._config!.apiBase
        ? `${this._config!.apiBase}/api/feedback`
        : '/api/feedback';

      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: this._config!.projectId,
          title: formData.get('title'),
          description: formData.get('description'),
          category: formData.get('category'),
          email: formData.get('email') || undefined,
          fingerprint,
        }),
      });

      if (!res.ok) throw new Error('Failed to submit');

      form.reset();
      messageEl.textContent = 'フィードバックを送信しました！';
      messageEl.className = 'vb-message vb-success';
      setTimeout(() => {
        messageEl.className = 'vb-message vb-hidden';
      }, 3000);
    } catch {
      messageEl.textContent = '送信に失敗しました。もう一度お試しください。';
      messageEl.className = 'vb-message vb-error';
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = '送信';
    }
  },
};

// Export for IIFE
(window as unknown as Record<string, unknown>).VoiceBoard = VoiceBoard;

export default VoiceBoard;
