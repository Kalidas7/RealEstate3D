// ========================================
// Camera Movement Styles - Injected CSS
// ========================================

export const CameraMovementStyles = `
  /* Adjacent node buttons — horizontal row at bottom */
  .adj-btns-container {
    position: absolute;
    bottom: 80px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    gap: 10px;
    z-index: 100;
    pointer-events: auto;
    flex-wrap: wrap;
    justify-content: center;
    max-width: 90vw;
  }
  .adj-btn {
    padding: 10px 20px;
    background: rgba(255, 102, 0, 0.9);
    color: white;
    border: 1.5px solid rgba(255,255,255,0.35);
    border-radius: 24px;
    font-weight: bold;
    font-size: 13px;
    cursor: pointer;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    box-shadow: 0 4px 16px rgba(0,0,0,0.35);
    letter-spacing: 0.3px;
    transition: background 0.2s, transform 0.15s;
    white-space: nowrap;
  }
  .adj-btn:active {
    transform: scale(0.95);
    background: rgba(255, 130, 0, 1);
  }

  /* All Rooms menu toggle */
  .menu-toggle-btn {
    position: absolute;
    bottom: 20px;
    right: 20px;
    width: 44px;
    height: 44px;
    border-radius: 22px;
    background: rgba(102, 126, 234, 0.9);
    color: white;
    border: 1.5px solid rgba(255,255,255,0.3);
    font-size: 20px;
    cursor: pointer;
    z-index: 100;
    box-shadow: 0 4px 16px rgba(0,0,0,0.3);
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: auto;
  }
  .menu-toggle-btn:active {
    background: rgba(102, 126, 234, 1);
    transform: scale(0.95);
  }

  /* All Rooms dropdown */
  .all-rooms-menu {
    position: absolute;
    bottom: 75px;
    right: 20px;
    background: rgba(20, 20, 30, 0.95);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255,255,255,0.15);
    border-radius: 16px;
    padding: 8px;
    z-index: 200;
    min-width: 180px;
    max-height: 60vh;
    overflow-y: auto;
    box-shadow: 0 8px 32px rgba(0,0,0,0.5);
    pointer-events: auto;
  }
  .menu-header {
    padding: 10px 14px;
    color: rgba(255,255,255,0.5);
    font-size: 12px;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    margin-bottom: 4px;
  }
  .menu-item {
    display: block;
    width: 100%;
    padding: 12px 14px;
    background: transparent;
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    cursor: pointer;
    text-align: left;
    font-family: -apple-system, BlinkMacSystemFont, sans-serif;
    transition: background 0.15s;
  }
  .menu-item:active {
    background: rgba(255, 102, 0, 0.3);
  }
`;
