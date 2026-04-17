// Player.tsx — Bottom audio player bar
//
// Plays the currently selected song. Shows playback controls + progress.

import React, { useRef, useState, useEffect } from 'react';
import type { Song } from '../../types';
import './Player.css';

interface PlayerProps {
  song: Song | null;
}

export const Player: React.FC<PlayerProps> = ({ song }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Reset when song changes
  useEffect(() => {
    setPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    if (audioRef.current && song?.audio_url) {
      audioRef.current.load();
    }
  }, [song?.id]);

  // Auto-play on song change
  useEffect(() => {
    if (song?.audio_url && audioRef.current) {
      audioRef.current.play().then(() => setPlaying(true)).catch(() => {});
    }
  }, [song?.id]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (playing) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setPlaying(!playing);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!audioRef.current) return;
    const time = parseFloat(e.target.value);
    audioRef.current.currentTime = time;
    setCurrentTime(time);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  if (!song) {
    return (
      <div className="player player-empty">
        <span className="player-empty-text">Select a song to play</span>
      </div>
    );
  }

  return (
    <div className="player">
      <audio
        ref={audioRef}
        src={song.audio_url}
        onTimeUpdate={() => setCurrentTime(audioRef.current?.currentTime || 0)}
        onDurationChange={() => setDuration(audioRef.current?.duration || 0)}
        onEnded={() => setPlaying(false)}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      />

      {/* Song info */}
      <div className="player-info">
        <div className="player-title">{song.title || 'Untitled'}</div>
        <div className="player-caption">{song.caption?.substring(0, 40) || ''}</div>
      </div>

      {/* Controls */}
      <div className="player-controls">
        <button className="btn btn-ghost btn-icon player-play-btn" onClick={togglePlay}>
          {playing ? '⏸' : '▶'}
        </button>

        <span className="player-time">{formatTime(currentTime)}</span>
        <input
          type="range"
          className="player-seek"
          value={currentTime}
          onChange={handleSeek}
          min={0}
          max={duration || 0}
          step={0.1}
        />
        <span className="player-time">{formatTime(duration)}</span>
      </div>

      {/* Volume placeholder */}
      <div className="player-end">
        <a href={song.audio_url} download className="btn btn-ghost btn-sm">⬇</a>
      </div>
    </div>
  );
};
