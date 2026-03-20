// Interior 3D Viewer — CSS Styles

export function getInteriorCSS(): string {
  return `
    <style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { background: #0a0a0a; overflow: hidden; }
      #container { width: 100vw; height: 100vh; }
      #loading {
        position: absolute; top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        color: white; font-size: 16px; text-align: center;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      }
      .spinner {
        border: 3px solid rgba(255,255,255,0.1);
        border-top: 3px solid #667eea;
        border-radius: 50%; width: 40px; height: 40px;
        animation: spin 1s linear infinite;
        margin: 0 auto 16px;
      }
      @keyframes spin { to { transform: rotate(360deg); } }
      #error { display: none; position: absolute; top: 50%; left: 50%;
        transform: translate(-50%, -50%); color: #ff6b6b;
        text-align: center; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }

      /* ---- Navigation UI ---- */
      .nav-area {
        position: absolute;
        bottom: 24px;
        left: 0; right: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        pointer-events: none;
        z-index: 100;
      }

      /* Sub-node dots (prev/next within a room) */
      .subnode-row {
        display: none;
        align-items: center;
        gap: 10px;
        background: rgba(0, 0, 0, 0.6);
        padding: 6px 14px;
        border-radius: 24px;
        border: 1px solid rgba(255,255,255,0.15);
        backdrop-filter: blur(10px);
        pointer-events: auto;
      }
      .subnode-row.visible { display: flex; }
      .subnode-arrow {
        width: 26px; height: 26px;
        background: transparent;
        color: #667eea; border: 1.5px solid #667eea; border-radius: 50%;
        font-size: 12px; cursor: pointer;
        display: flex; align-items: center; justify-content: center;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        transition: transform 0.15s, opacity 0.2s, border-color 0.2s;
      }
      .subnode-arrow:active { transform: scale(0.9); }
      .subnode-arrow:disabled { opacity: 0.3; cursor: not-allowed; border-color: rgba(150,150,150,0.5); color: rgba(150,150,150,0.5); }
      .subnode-dots {
        display: flex; gap: 6px; align-items: center;
      }
      .subnode-dot {
        width: 6px; height: 6px; border-radius: 50%;
        background: rgba(255,255,255,0.3);
        transition: background 0.3s, transform 0.3s;
      }
      .subnode-dot.active {
        background: #667eea;
        transform: scale(1.3);
      }
      .subnode-label {
        color: white; font-size: 10px; font-weight: 600;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        max-width: 140px; text-align: center;
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }

      /* Room buttons (scrollable row) */
      .room-buttons-row {
        display: flex;
        gap: 6px;
        padding: 6px 12px;
        background: rgba(0, 0, 0, 0.6);
        border-radius: 24px;
        border: 1px solid rgba(255,255,255,0.15);
        backdrop-filter: blur(10px);
        pointer-events: auto;
        overflow-x: auto;
        max-width: 90vw;
        -webkit-overflow-scrolling: touch;
        scrollbar-width: none;
      }
      .room-buttons-row::-webkit-scrollbar { display: none; }
      .room-btn {
        padding: 6px 12px;
        background: transparent;
        color: #667eea; border: 1.5px solid #667eea; border-radius: 16px;
        font-weight: 600; font-size: 11px; cursor: pointer;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        transition: background 0.2s, transform 0.15s, border-color 0.2s;
        white-space: nowrap;
        flex-shrink: 0;
      }
      .room-btn:active { transform: scale(0.95); background: rgba(102, 126, 234, 0.15); }

      /* Room name label */
      .room-name-label {
        color: white; font-size: 13px; font-weight: 700;
        font-family: -apple-system, BlinkMacSystemFont, sans-serif;
        text-shadow: 0 1px 4px rgba(0,0,0,0.7);
      }
    </style>`;
}
