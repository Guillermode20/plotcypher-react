import { memo, useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { fetchLatestCommitDate } from '../utils/gitHubUtils';

const ProjectInfoPopUp = ({ showProjectModal, onClose }) => {
  const [, setLatestCommitDate] = useState('Loading...');
  const modalRef = useRef(null);

  useEffect(() => {
    const getLatestCommit = async () => {
      const date = await fetchLatestCommitDate();
      setLatestCommitDate(date);
    };
    if (showProjectModal) {
      getLatestCommit();
      modalRef.current.focus();
    }
  }, [showProjectModal]);

  if (!showProjectModal) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" role="dialog" aria-modal="true">
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}></div>
      <div
        ref={modalRef}
        tabIndex={-1}
        className="relative bg-zinc-950 border border-white/30 rounded-lg 
                   max-w-md w-full mx-1 sm:mx-2 my-2 sm:my-4 shadow-xl 
                   focus:outline-none focus:ring-0
                   flex flex-col max-h-[90vh] sm:max-h-[85vh]"
      >
        {/* Fixed Header */}
        <div className="p-3 sm:p-4 border-b border-white/10">
          <h2 className="text-lg sm:text-2xl font-bold text-white/90 tracking-wider">
            About PLOTCYPHER
          </h2>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          <div className="text-white/90 space-y-4">
            <p className="text-xs sm:text-base">Version v0.2.0</p>
            <p className="text-sm sm:text-base">Changelog: <span className="text-white/70">Added the full database for 365 days of movies, tv, and games!</span></p>
            <p className="text-sm sm:text-base">Created by Will Hick</p>
            <div className="flex flex-col gap-2 pt-2">
              {/* GitHub Link */}
              <a
                href="https://github.com/guillermode20/plotcypher-react"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs sm:text-sm text-white/70 hover:text-white/90 transition-colors duration-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                GitHub
              </a>
              {/* LinkedIn Link */}
              <a
                href="https://www.linkedin.com/in/will-hick-809813303/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs sm:text-sm text-white/70 hover:text-white/90 transition-colors duration-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
                LinkedIn
              </a>
              {/* Portfolio Link */}
              <a
                href="https://will-hick-cv.click"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs sm:text-sm text-white/70 hover:text-white/90 transition-colors duration-300"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 008.716-6.747M12 21a9.004 9.004 0 01-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 017.843 4.582M12 3a8.997 8.997 0 00-7.843 4.582m15.686 0A11.953 11.953 0 0112 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0121 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0112 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 013 12c0-1.605.42-3.113 1.157-4.418" />
                </svg>
                Portfolio
              </a>
            </div>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="plotcypher-white-btn"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

ProjectInfoPopUp.propTypes = {
  showProjectModal: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default memo(ProjectInfoPopUp);