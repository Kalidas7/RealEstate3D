// ========================================
// Camera Movement Styles - Injected CSS
// ========================================

export const CameraMovementStyles = `
  .nav-btn {
    position: absolute;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    padding: 12px 28px;
    background: rgba(255, 102, 0, 0.9);
    color: white;
    border: 1.5px solid rgba(255,255,255,0.35);
    border-radius: 28px;
    font-weight: bold;
    font-size: 14px;
    cursor: pointer;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    box-shadow: 0 6px 20px rgba(0,0,0,0.35);
    z-index: 100;
    pointer-events: auto;
    letter-spacing: 0.3px;
    transition: background 0.2s, transform 0.15s;
  }
  .nav-btn:active {
    transform: translateX(-50%) scale(0.95);
    background: rgba(255, 130, 0, 1);
  }
`;
