/**
 * CommentEditor Component
 *
 * Displays and edits comments for the current move with markdown support
 */

import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useGameTreeBoard, useGameTreeEdit } from '../../contexts/GameTreeContext';
import './CommentEditor.css';

// Header actions component for external use
export const CommentHeaderActions: React.FC<{
  moveNumber: number;
  isEditing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
}> = ({ moveNumber, isEditing, onEdit, onSave, onCancel }) => {
  const { t } = useTranslation();
  return (
    <>
      {moveNumber > 0 && (
        <span className="move-number">{t('comment.move', { number: moveNumber })}</span>
      )}
      {!isEditing && (
        <button onClick={onEdit} className="comment-edit-button" title={t('comment.editComment')}>
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
      )}
      {isEditing && (
        <div className="comment-actions">
          <button
            onClick={onSave}
            className="comment-save-button"
            title={t('comment.saveShortcut')}
          >
            {t('comment.save')}
          </button>
          <button
            onClick={onCancel}
            className="comment-cancel-button"
            title={t('comment.cancelShortcut')}
          >
            {t('comment.cancel')}
          </button>
        </div>
      )}
    </>
  );
};

// Hook to get comment editor state for external header actions
export const useCommentEditorState = () => {
  const { currentNode, moveNumber } = useGameTreeBoard();
  const { setNodeComment: updateComment } = useGameTreeEdit();
  const [isEditing, setIsEditing] = useState(false);
  const [editText, setEditText] = useState('');

  const currentComment = currentNode?.data.C?.[0] || '';

  useEffect(() => {
    setEditText(currentComment);
    setIsEditing(false);
  }, [currentComment, currentNode?.id]);

  const handleEdit = useCallback(() => {
    setEditText(currentComment);
    setIsEditing(true);
  }, [currentComment]);

  const handleSave = useCallback(() => {
    updateComment(editText);
    setIsEditing(false);
  }, [editText, updateComment]);

  const handleCancel = useCallback(() => {
    setEditText(currentComment);
    setIsEditing(false);
  }, [currentComment]);

  return {
    moveNumber,
    isEditing,
    editText,
    setEditText,
    currentComment,
    currentNode,
    handleEdit,
    handleSave,
    handleCancel,
  };
};

export const CommentEditor: React.FC = () => {
  const { t } = useTranslation();
  const {
    moveNumber,
    isEditing,
    editText,
    setEditText,
    currentComment,
    currentNode,
    handleEdit,
    handleSave,
    handleCancel,
  } = useCommentEditorState();

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleCancel();
      } else if (e.key === 's' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        handleSave();
      }
    },
    [handleCancel, handleSave]
  );

  if (!currentNode) {
    return (
      <div className="comment-editor">
        <div className="comment-empty">{t('comment.noMoveSelected')}</div>
      </div>
    );
  }

  return (
    <div className="comment-editor">
      {isEditing ? (
        <div className="comment-editor-container">
          <textarea
            value={editText}
            onChange={e => setEditText(e.target.value)}
            onKeyDown={handleKeyDown}
            className="comment-textarea"
            placeholder={t('comment.placeholder')}
            autoFocus
          />
          <div className="comment-hint">{t('comment.markdownHint')}</div>
        </div>
      ) : (
        <div className="comment-display">
          {currentComment ? (
            <div className="comment-markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{currentComment}</ReactMarkdown>
            </div>
          ) : (
            <div className="comment-empty" onClick={handleEdit}>
              {t('comment.noComment')}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
