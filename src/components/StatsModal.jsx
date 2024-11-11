import { memo, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';

const StatsModal = ({ isOpen, onClose }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      modalRef.current.focus();
    }
  }, [isOpen]);

  if (!isOpen) return null;

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
        

        {/* Fixed Footer */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="w-full sm:w-auto px-6 py-2
                       text-white/90 tracking-[0.2em]
                       border border-white/30 rounded-md
                       bg-zinc-950
                       hover:bg-zinc-950 hover:border-white/30
                       focus:outline-none focus:border-white/40
                       focus:ring-2 focus:ring-white/20
                       transition-all duration-300"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

StatsModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired
};

export default memo(StatsModal);