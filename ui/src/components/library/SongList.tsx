// SongList.tsx — Song library display
//
// Lists saved songs. Click to play, hover for actions.

import React from 'react';
import type { Song } from '../../types';
import './SongList.css';

interface SongListProps {
  songs: Song[];
  currentSongId?: string;
  onPlay: (song: Song) => void;
  onDelete: (songId: string) => void;
}

export const SongList: React.FC<SongListProps> = ({
  songs, currentSongId, onPlay, onDelete,
}) => {
  if (songs.length === 0) {
    return (
      <div className="song-list-empty">
        <div className="song-list-empty-icon">🎵</div>
        <div className="song-list-empty-text">No songs yet</div>
        <div className="song-list-empty-hint">Create your first track to see it here</div>
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    if (!seconds) return '--:--';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="song-list">
      <div className="song-list-header">
        <h3>Library</h3>
        <span className="song-count">{songs.length} song{songs.length !== 1 ? 's' : ''}</span>
      </div>

      <div className="song-list-items">
        {songs.map(song => (
          <div
            key={song.id}
            className={`song-item ${currentSongId === song.id ? 'active' : ''}`}
            onClick={() => onPlay(song)}
          >
            <div className="song-item-info">
              <div className="song-item-title">{song.title || 'Untitled'}</div>
              <div className="song-item-meta">
                {song.caption ? song.caption.substring(0, 50) : song.style?.substring(0, 50) || 'No description'}
                {song.bpm ? ` · ${song.bpm} BPM` : ''}
              </div>
            </div>
            <div className="song-item-actions">
              <span className="song-item-duration">{formatDuration(song.duration)}</span>
              <button
                className="btn btn-ghost btn-sm"
                onClick={e => { e.stopPropagation(); onDelete(song.id); }}
                title="Delete"
              >
                🗑
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
