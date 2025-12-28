/**
 * Sente/Gote Settings Modal
 * Configuration dialog for sente/gote analysis parameters
 */

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { LuX } from 'react-icons/lu';
import { useSenteGote } from '../../contexts/SenteGoteContext';
import type { SenteGoteSettings } from '../../contexts/SenteGoteContext';

interface SenteGoteSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SenteGoteSettingsModal: React.FC<SenteGoteSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { senteGoteSettings, updateSenteGoteSettings } = useSenteGote();
  const [localSettings, setLocalSettings] = useState<SenteGoteSettings>(senteGoteSettings);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);

  // Sync local settings with context when modal opens
  useEffect(() => {
    if (isOpen) {
      setLocalSettings(senteGoteSettings);
    }
  }, [isOpen, senteGoteSettings]);

  // Resolve portal container after mount
  useEffect(() => {
    setPortalContainer(document.body);
  }, []);

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleSave = () => {
    updateSenteGoteSettings(localSettings);
    onClose();
  };

  const handleCancel = () => {
    setLocalSettings(senteGoteSettings);
    onClose();
  };

  if (!isOpen || !portalContainer) return null;

  return createPortal(
    <div
      className="modal-overlay"
      onClick={e => {
        if (e.target === e.currentTarget) {
          handleCancel();
        }
      }}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      }}
    >
      <div
        className="modal-content"
        style={{
          backgroundColor: 'var(--bg-primary)',
          borderRadius: '8px',
          padding: '24px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80vh',
          overflow: 'auto',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.3)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '20px',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '18px', fontWeight: 600 }}>Sente/Gote Settings</h2>
          <button
            onClick={handleCancel}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '4px',
              display: 'flex',
              alignItems: 'center',
            }}
            aria-label="Close"
          >
            <LuX size={20} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localSettings.enabled}
                onChange={e => setLocalSettings({ ...localSettings, enabled: e.target.checked })}
              />
              <span>Enable Sente/Gote Analysis</span>
            </label>
            <p style={{ margin: '4px 0 0 24px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Analyze moves to determine if they are sente (forcing) or gote (non-forcing)
            </p>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Local Response Threshold: {localSettings.localThreshold} intersections
            </label>
            <input
              type="range"
              min="1"
              max="10"
              value={localSettings.localThreshold}
              onChange={e =>
                setLocalSettings({ ...localSettings, localThreshold: parseInt(e.target.value) })
              }
              style={{ width: '100%' }}
            />
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Distance (in intersections) for a move to be considered a "local" response
            </p>
          </div>

          <div>
            <label style={{ display: 'block', marginBottom: '8px', fontWeight: 500 }}>
              Sente Threshold: {(localSettings.senteThreshold * 100).toFixed(0)}% win rate loss
            </label>
            <input
              type="range"
              min="0.01"
              max="0.15"
              step="0.01"
              value={localSettings.senteThreshold}
              onChange={e =>
                setLocalSettings({ ...localSettings, senteThreshold: parseFloat(e.target.value) })
              }
              style={{ width: '100%' }}
            />
            <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Minimum win rate loss required for a move to be classified as sente
            </p>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localSettings.showInTree}
                onChange={e => setLocalSettings({ ...localSettings, showInTree: e.target.checked })}
              />
              <span>Show badges in game tree</span>
            </label>
            <p style={{ margin: '4px 0 0 24px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Display sente/gote badges on stones in the game tree visualization
            </p>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localSettings.showInComments}
                onChange={e =>
                  setLocalSettings({ ...localSettings, showInComments: e.target.checked })
                }
              />
              <span>Show in move comments</span>
            </label>
            <p style={{ margin: '4px 0 0 24px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Add sente/gote labels to move comments
            </p>
          </div>

          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={localSettings.saveToSgf}
                onChange={e => setLocalSettings({ ...localSettings, saveToSgf: e.target.checked })}
              />
              <span>Save to SGF file</span>
            </label>
            <p style={{ margin: '4px 0 0 24px', fontSize: '13px', color: 'var(--text-secondary)' }}>
              Persist sente/gote analysis results when saving the game
            </p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', marginTop: '24px' }}>
          <button
            onClick={handleCancel}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: '1px solid var(--border-color)',
              background: 'transparent',
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: 'none',
              background: 'var(--accent-color, #3b82f6)',
              color: 'white',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>,
    portalContainer
  );
};
