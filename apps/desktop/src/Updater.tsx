import { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { check, Update } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { ask, message } from '@tauri-apps/plugin-dialog';
import { listen } from '@tauri-apps/api/event';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';
import './Updater.css';

export function Updater() {
  const { t, ready } = useTranslation();
  const [update, setUpdate] = useState<Update | null>(null);
  const [status, setStatus] = useState<'idle' | 'available' | 'installing'>('idle');

  const checkForUpdates = useCallback(
    async (silent = false) => {
      try {
        const updateResult = await check();
        if (updateResult?.available) {
          const skippedVersion = localStorage.getItem('kaya-skipped-version');

          // If manual check (not silent) OR version not skipped
          if (!silent || skippedVersion !== updateResult.version) {
            setUpdate(updateResult);
            setStatus('available');
          }
        } else if (!silent) {
          await message(t('updater.youAreOnLatest'), {
            title: t('updater.noUpdateAvailable'),
            kind: 'info',
          });
        }
      } catch (error) {
        console.error(error);
        if (!silent) {
          await message(
            `${t('updater.checkFailed')}\n${error}\n\n${t('updater.manualDownload')} https://github.com/kaya-go/kaya/releases`,
            {
              title: 'Error',
              kind: 'error',
            }
          );
        }
      }
    },
    [t]
  );

  // Listen for menu event to check for updates
  useEffect(() => {
    const unlisten = listen('check-update', () => {
      checkForUpdates(false);
    });

    return () => {
      unlisten.then(u => u());
    };
  }, [checkForUpdates]);

  // Auto-check on startup (silent) - wait for translations to be ready
  useEffect(() => {
    if (!import.meta.env.DEV && ready) {
      checkForUpdates(true);
    }
  }, [ready, checkForUpdates]);

  const handleUpdate = async () => {
    if (!update) return;
    setStatus('installing');
    try {
      await update.downloadAndInstall();

      // Ask user to restart
      const restart = await ask(t('updater.restartPrompt'), {
        title: t('updater.updateInstalled'),
        kind: 'info',
        okLabel: t('updater.restart'),
        cancelLabel: t('updater.later'),
      });

      if (restart) {
        await relaunch();
      }

      // Close dialog regardless of restart choice (if they chose Later)
      setStatus('idle');
      setUpdate(null);
    } catch (err) {
      console.error('Failed to install update:', err);
      await message(
        `${t('updater.updateFailedMessage')}\n\nhttps://github.com/kaya-go/kaya/releases`,
        {
          title: t('updater.updateFailed'),
          kind: 'error',
        }
      );
      setStatus('available'); // Re-enable buttons
    }
  };

  const handleSkip = () => {
    if (update) {
      localStorage.setItem('kaya-skipped-version', update.version);
      setStatus('idle');
      setUpdate(null);
    }
  };

  const handleLater = () => {
    setStatus('idle');
    setUpdate(null);
  };

  if (status === 'idle' || !update) return null;

  return (
    <div className="updater-overlay">
      <div className="updater-dialog">
        <h2>{t('updater.updateAvailable')}</h2>
        <p>{t('updater.versionAvailable', { version: update.version })}</p>
        {update.body && (
          <div className="updater-release-notes">
            <ReactMarkdown remarkPlugins={[remarkGfm, remarkBreaks]}>{update.body}</ReactMarkdown>
          </div>
        )}

        {status === 'installing' ? (
          <div className="updater-status">
            <p>{t('updater.installing')}</p>
          </div>
        ) : (
          <div className="updater-actions">
            <button onClick={handleSkip}>{t('updater.skipVersion')}</button>
            <button onClick={handleLater}>{t('updater.remindLater')}</button>
            <button className="primary" onClick={handleUpdate}>
              {t('updater.updateNow')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
