// ========================================
// Camera Movement Styles - Injected CSS
// ========================================

export const CameraMovementStyles = `
  .nav-container {
    position: absolute;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 12px;
    background: rgba(0, 0, 0, 0.6);
    padding: 8px 16px;
    border-radius: 28px;
    border: 1px solid rgba(255,255,255,0.15);
    backdrop-filter: blur(10px);
    z-index: 100;
    pointer-events: auto;
  }
  .nav-btn-small {
    padding: 8px 16px;
    background: rgba(255, 102, 0, 0.9);
    color: white;
    border: none;
    border-radius: 20px;
    font-weight: bold;
    font-size: 13px;
    cursor: pointer;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    transition: background 0.2s, transform 0.15s, opacity 0.2s;
  }
  .nav-btn-small:active {
    transform: scale(0.95);
  }
  .nav-btn-small:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    background: rgba(150, 150, 150, 0.5);
  }
  .nav-label {
    color: white;
    font-size: 14px;
    font-weight: 600;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    min-width: 70px;
    text-align: center;
  }
`;
