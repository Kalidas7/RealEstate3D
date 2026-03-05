// Graffiti Exterior — uses the shared ThreeDModal
import React from 'react';
import ThreeDModal, { BuildingConfig } from '../../../ThreeDModal';
import { graffitiExteriorConfig } from './config';

interface GraffitiExteriorProps {
  visible: boolean;
  onClose: () => void;
  modelUrl: string | null;
  propertyName: string;
  buildingConfig?: BuildingConfig;
  onEnterInterior?: () => void;
}

export default function GraffitiExterior({
  visible,
  onClose,
  modelUrl,
  propertyName,
  buildingConfig,
  onEnterInterior,
}: GraffitiExteriorProps) {
  // Use API config if available, fall back to local config
  const config = buildingConfig && (buildingConfig.fixedButtons?.length > 0 || buildingConfig.interactiveMeshNames?.length > 0)
    ? buildingConfig
    : graffitiExteriorConfig;

  React.useEffect(() => {
    if (visible) {
      console.log(`[FILE EXECUTING: frontend/components/buildings/Graffiti/exterior/index.tsx] Delegating to ThreeDModal`);
    }
  }, [visible]);

  return (
    <ThreeDModal
      visible={visible}
      onClose={onClose}
      modelUrl={modelUrl}
      propertyName={propertyName}
      buildingConfig={config}
      onEnterInterior={onEnterInterior}
    />
  );
}
