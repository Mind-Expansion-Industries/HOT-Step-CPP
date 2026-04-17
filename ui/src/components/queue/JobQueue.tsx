// JobQueue.tsx — Display active generation jobs with progress
//
// ~60 lines. Shows status, progress bar, cancel button.

import React from 'react';
import type { GenerationJob } from '../../types';
import './JobQueue.css';

interface JobQueueProps {
  jobs: GenerationJob[];
  onCancel: (jobId: string) => void;
  onClearCompleted: () => void;
}

export const JobQueue: React.FC<JobQueueProps> = ({ jobs, onCancel, onClearCompleted }) => {
  if (jobs.length === 0) return null;

  const hasCompleted = jobs.some(j =>
    ['succeeded', 'failed', 'cancelled'].includes(j.status)
  );

  return (
    <div className="job-queue">
      <div className="flex items-center justify-between" style={{ marginBottom: 'var(--space-3)' }}>
        <h3 className="job-queue-title">Generation Queue</h3>
        {hasCompleted && (
          <button className="btn btn-ghost btn-sm" onClick={onClearCompleted}>Clear</button>
        )}
      </div>

      {jobs.map(job => (
        <div key={job.jobId} className={`job-item job-${job.status}`}>
          <div className="flex items-center justify-between">
            <div className="job-stage">{job.stage || job.status}</div>
            {['pending', 'lm_running', 'synth_running'].includes(job.status) && (
              <button className="btn btn-ghost btn-sm" onClick={() => onCancel(job.jobId)}>
                ✕
              </button>
            )}
          </div>

          {job.progress !== undefined && job.progress > 0 && job.progress < 100 && (
            <div className="progress-bar" style={{ marginTop: '6px' }}>
              <div className="progress-fill" style={{ width: `${job.progress}%` }} />
            </div>
          )}

          {job.status === 'failed' && job.error && (
            <div className="job-error">{job.error}</div>
          )}
        </div>
      ))}
    </div>
  );
};
