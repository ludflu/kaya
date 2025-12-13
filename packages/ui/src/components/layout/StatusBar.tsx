import React from 'react';
import { LuSparkles, LuBug } from 'react-icons/lu';
import { useTranslation } from 'react-i18next';
import './StatusBar.css';

export interface VersionData {
  version: string;
  gitHash: string;
  buildDate: string;
}

interface StatusBarProps {
  versionData?: VersionData;
  moveName?: string | null;
  moveUrl?: string | null;
  patternMatchingEnabled?: boolean;
  onTogglePatternMatching?: () => void;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  versionData,
  moveName,
  moveUrl,
  patternMatchingEnabled = true,
  onTogglePatternMatching,
}) => {
  const { t } = useTranslation();

  // Format version data if available
  let version: string | undefined;
  let gitHash: string | undefined;
  let buildDateFormatted: string | undefined;
  let versionUrl: string | undefined;
  let commitUrl: string | undefined;

  if (versionData) {
    version = versionData.version;
    gitHash = versionData.gitHash;
    buildDateFormatted = new Date(versionData.buildDate).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    const githubRepoUrl = 'https://github.com/kaya-go/kaya';
    versionUrl = `${githubRepoUrl}/releases/tag/v${version}`;
    commitUrl = `${githubRepoUrl}/commit/${gitHash}`;
  }

  return (
    <div className="status-bar">
      {/* Left side - Move info */}
      <div className="status-bar-section status-bar-left">
        {onTogglePatternMatching && (
          <button
            onClick={onTogglePatternMatching}
            className={`status-bar-pattern-toggle ${
              patternMatchingEnabled ? 'enabled' : 'disabled'
            }`}
            title={patternMatchingEnabled ? t('patternEnabled') : t('patternDisabled')}
          >
            <LuSparkles size={13} />
          </button>
        )}
        {moveName ? (
          <>
            {moveUrl ? (
              <a
                href={moveUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="status-bar-link"
                title={t('learnMore')}
              >
                {moveName}
              </a>
            ) : (
              <span className="status-bar-text">{moveName}</span>
            )}
          </>
        ) : (
          <span className="status-bar-text status-bar-empty">—</span>
        )}
      </div>

      {/* Right side - Version info */}
      <div className="status-bar-section status-bar-right">
        {versionData ? (
          <span className="status-bar-version">
            <a
              href={versionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="status-bar-link"
              title={t('viewVersion')}
            >
              v{version}
            </a>
            {' • '}
            <a
              href={commitUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="status-bar-link"
              title={t('viewCommit')}
            >
              {gitHash}
            </a>
            {' • '}
            <span className="status-bar-date">{buildDateFormatted}</span>
          </span>
        ) : (
          <span className="status-bar-text status-bar-empty">—</span>
        )}
        {' • '}
        <a
          href="https://github.com/kaya-go/kaya/issues/new/choose"
          target="_blank"
          rel="noopener noreferrer"
          className="status-bar-report-button"
          title={t('reportBug')}
        >
          <LuBug size={13} />
          <span>{t('reportIssue')}</span>
        </a>
      </div>
    </div>
  );
};
