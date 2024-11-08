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
        className="relative bg-zinc-950 border border-white/20 rounded-lg p-8 max-w-md w-full m-4 shadow-xl focus:outline-none focus:ring-0"
      >
        <h2 className="text-2xl font-bold text-white/90 mb-4 tracking-wider">Welcome to PLOTCYPHER!</h2>
        <div className="text-white/80 space-y-4 mb-6">
          <p>
            PLOTCYPHER is a daily challenge game where you decrypt descriptions of Games, Movies, and TV Shows.
          </p>
          <p>
            Each category gives you 5 attempts to guess correctly. With each failed attempt, 
            the description becomes less cryptic, making it easier to identify the answer.
          </p>
          <p>
            ⚡ Type your guess in the input field<br/>
            🎯 Click DECRYPT to submit your answer<br/>
            🔄 Come back daily for new challenges
          </p>
          <p>
            Remember, you&apos;ll only get one shot, and each challenge is only available for 24 hours before it&apos;s gone forever!
          </p>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 border border-white/20 rounded-md bg-zinc-950/50 hover:bg-zinc-950/70 hover:border-white/20 focus:outline-none focus:border-white/20 focus:ring-2 focus:ring-white/20 transition-all duration-300"
        >
          Got it!
        </button>
      </div>
    </div>
  );
};
InfoPopUp.propTypes = {
  showInfoModal: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
};

export default memo(InfoPopUp);
