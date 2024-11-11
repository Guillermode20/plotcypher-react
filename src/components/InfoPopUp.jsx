import { useEffect, useRef, memo } from 'react';
import PropTypes from 'prop-types';

const InfoPopUp = ({ showInfoModal, onClose }) => {
  const modalRef = useRef(null);

  useEffect(() => {
    if (showInfoModal) {
      modalRef.current.focus();
    }
  }, [showInfoModal]);

  if (!showInfoModal) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50" role="dialog" aria-modal="true">
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      ></div>
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
            How to Play
          </h2>
        </div>

        {/* Scrollable Content */}
        <div className="p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
          <div className="text-white/90 space-y-4">
            <p className="text-sm sm:text-base text-white/90">
              PLOTCYPHER is a daily challenge game where you decrypt descriptions of Games, Movies, and TV Shows.
            </p>
            <p className="text-sm sm:text-base text-white/90">
              Each category gives you 5 attempts to guess correctly. With each failed attempt, 
              the description becomes less cryptic, making it easier to identify the answer.
            </p>
            <p className="text-sm sm:text-base text-white/90">
              ⚡ Type your guess in the input field<br/>
              🎯 Click DECRYPT to submit your answer<br/>
              🔄 Come back daily for new challenges
            </p>
            <p className="text-sm sm:text-base text-white/90">
              Remember, you&apos;ll only get one shot, and each challenge is only available for 24 hours before it&apos;s gone forever!
            </p>
          </div>
        </div>

        {/* Fixed Footer */}
        <div className="p-4 border-t border-white/10">
          <button
            onClick={onClose}
            className="plotcypher-white-btn"
          >
            Got it!
          </button>
        </div>
      </div>
    </div>
  );
};
InfoPopUp.propTypes = {
  showInfoModal: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default memo(InfoPopUp);
