import { useState, useEffect } from 'react';

export interface HapticSettings {
  enabled: boolean;
  enabledTypes: {
    interactions: boolean;
    milestones: boolean;
    achievements: boolean;
    errors: boolean;
    navigation: boolean;
    longPress: boolean;
  };
  intensity: 'light' | 'medium' | 'strong';
  longPressDuration: number; // in milliseconds
}

const DEFAULT_SETTINGS: HapticSettings = {
  enabled: true,
  enabledTypes: {
    interactions: true,
    milestones: true,
    achievements: true,
    errors: true,
    navigation: true,
    longPress: true,
  },
  intensity: 'medium',
  longPressDuration: 1000,
};

const STORAGE_KEY = 'haptic-settings';

export function useHapticSettings() {
  const [settings, setSettings] = useState<HapticSettings>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading haptic settings:', error);
    }
    return DEFAULT_SETTINGS;
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving haptic settings:', error);
    }
  }, [settings]);

  const updateSettings = (updates: Partial<HapticSettings>) => {
    setSettings(prev => ({ ...prev, ...updates }));
  };

  const updateEnabledType = (type: keyof HapticSettings['enabledTypes'], enabled: boolean) => {
    setSettings(prev => ({
      ...prev,
      enabledTypes: {
        ...prev.enabledTypes,
        [type]: enabled,
      },
    }));
  };

  const resetSettings = () => {
    setSettings(DEFAULT_SETTINGS);
  };

  return {
    settings,
    updateSettings,
    updateEnabledType,
    resetSettings,
  };
}
