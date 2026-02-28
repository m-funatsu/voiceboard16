export function createStyles(accentColor: string, position: string): string {
  const isRight = position.includes('right');
  const isBottom = position.includes('bottom');

  return `
    :host {
      all: initial;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 14px;
      color: #1f2937;
    }

    .vb-hidden { display: none !important; }

    .vb-trigger {
      position: fixed;
      ${isBottom ? 'bottom: 20px' : 'top: 20px'};
      ${isRight ? 'right: 20px' : 'left: 20px'};
      background: ${accentColor};
      color: white;
      border: none;
      border-radius: 24px;
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.15);
      z-index: 999999;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .vb-trigger:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 16px rgba(0,0,0,0.2);
    }

    .vb-modal {
      position: fixed;
      ${isBottom ? 'bottom: 70px' : 'top: 70px'};
      ${isRight ? 'right: 20px' : 'left: 20px'};
      width: 360px;
      max-height: 500px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.12);
      z-index: 999998;
      overflow: hidden;
    }

    .vb-modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      border-bottom: 1px solid #e5e7eb;
    }

    .vb-modal-title {
      font-weight: 600;
      font-size: 15px;
    }

    .vb-close {
      background: none;
      border: none;
      font-size: 20px;
      cursor: pointer;
      color: #6b7280;
      padding: 0 4px;
    }

    .vb-form {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .vb-input, .vb-textarea, .vb-select {
      width: 100%;
      padding: 8px 12px;
      border: 1px solid #d1d5db;
      border-radius: 8px;
      font-size: 14px;
      outline: none;
      background: white;
      box-sizing: border-box;
    }

    .vb-input:focus, .vb-textarea:focus, .vb-select:focus {
      border-color: ${accentColor};
      box-shadow: 0 0 0 2px ${accentColor}33;
    }

    .vb-textarea {
      resize: vertical;
      min-height: 60px;
    }

    .vb-honeypot {
      position: absolute;
      left: -9999px;
      opacity: 0;
      height: 0;
    }

    .vb-submit {
      background: ${accentColor};
      color: white;
      border: none;
      border-radius: 8px;
      padding: 10px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
    }

    .vb-submit:hover { opacity: 0.9; }
    .vb-submit:disabled { opacity: 0.5; cursor: not-allowed; }

    .vb-message {
      padding: 8px 12px;
      border-radius: 8px;
      font-size: 13px;
      text-align: center;
    }

    .vb-success {
      background: #ecfdf5;
      color: #065f46;
    }

    .vb-error {
      background: #fef2f2;
      color: #991b1b;
    }

    .vb-powered {
      text-align: center;
      padding: 8px;
      border-top: 1px solid #f3f4f6;
    }

    .vb-powered a {
      color: #9ca3af;
      font-size: 11px;
      text-decoration: none;
    }

    .vb-powered a:hover { color: #6b7280; }
  `;
}
