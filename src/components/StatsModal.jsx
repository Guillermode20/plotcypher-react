import { memo, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { calculateStats, resetStats } from '../utils/statsManager';

const StatsModal = ({ isOpen, onClose }) => {
  const modalRef = useRef(null);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (isOpen) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const stats = calculateStats();

  const handleReset = () => {
    resetStats();
    window.location.reload(); // Add page reload after reset
  };

  const handleResetClick = () => {
    setShowConfirmation(true);
  };

  const handleConfirm = () => {
    if (confirmText === 'DELETE') {
      handleReset();
      setShowConfirmation(false);
      setConfirmText('');
    }
  };

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
            Your Stats
          </h2>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 overflow-y-auto flex-grow scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          {Object.entries(stats).map(([category, categoryStats]) => (
            <div key={category} className="mb-6">
              <h3 className="text-lg font-semibold text-white/90 capitalize mb-3">
                {category} Category
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-zinc-900/50 p-3 rounded">
                  <p className="text-white/70">Games Played</p>
                  <p className="text-xl font-bold text-white/90">{categoryStats.gamesPlayed}</p>
                </div>
                <div className="bg-zinc-900/50 p-3 rounded">
                  <p className="text-white/70">Completed</p>
                  <p className="text-xl font-bold text-white/90">{categoryStats.gamesCompleted}</p>
                </div>
                <div className="bg-zinc-900/50 p-3 rounded">
                  <p className="text-white/70">Success Rate</p>
                  <p className="text-xl font-bold text-white/90">{categoryStats.successRate}%</p>
                </div>
                <div className="bg-zinc-900/50 p-3 rounded">
                  <p className="text-white/70">Avg Attempts</p>
                  <p className="text-xl font-bold text-white/90">{categoryStats.averageAttempts}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Fixed Footer */}
        <div className="p-4 border-t border-white/10 flex space-x-2">
          <button
            onClick={onClose}
            className="plotcypher-white-btn"
          >
            Close
          </button>
          <button
            onClick={handleResetClick}
            className="plotcypher-red-btn"
          >
            Reset your progress
          </button>
        </div>

        {/* Confirmation Modal */}
        {showConfirmation && (
          <div className="fixed inset-0 flex items-center justify-center z-50" role="dialog" aria-modal="true">
            <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => {
              setShowConfirmation(false);
              setConfirmText('');
            }}></div>
            <div className="relative bg-zinc-950 border border-white/30 rounded-lg 
                            max-w-md w-full mx-1 sm:mx-2 my-2 sm:my-4 shadow-xl 
                            focus:outline-none focus:ring-0
                            flex flex-col">
              {/* Fixed Header */}
              <div className="p-3 sm:p-4 border-b border-white/10">
                <h2 className="text-lg sm:text-2xl font-bold text-white/90 tracking-wider">
                  Confirm Reset
                </h2>
              </div>

              {/* Content */}
              <div className="p-4">
                <p className="text-white/70 mb-4">Type &quot;DELETE&quot; to confirm reset:</p>
                <input
                  type="text"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full px-4 py-2
                             text-white/90 tracking-[0.2em]
                             border border-white/30 rounded-md
                             bg-zinc-950
                             hover:bg-zinc-950 hover:border-white/30
                             focus:outline-none focus:border-white/40
                             focus:ring-2 focus:ring-white/20
                             transition-all duration-300"
                  autoFocus
                />
              </div>

              {/* Fixed Footer */}
              <div className="p-4 border-t border-white/10 flex space-x-2">
                <button
                  onClick={() => {
                    setShowConfirmation(false);
                    setConfirmText('');
                  }}
                  className="plotcypher-white-btn"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={confirmText !== 'DELETE'}
                  className="plotcypher-red-btn"
                >
                  Confirm Reset
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

StatsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default memo(StatsModal);