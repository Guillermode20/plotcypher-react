import { memo } from 'react';
import PropTypes from 'prop-types';
import Modal from './Modal';

const FailModal = ({ isOpen, onClose, selectedDescription, gameData }) => (
  <Modal isOpen={isOpen} onClose={onClose} variant="error">
    <h2 className="text-lg sm:text-2xl font-bold text-white/90">
      Mission Failed
    </h2>
    <p className="text-white/80 mb-3">
      The correct answer was:
      <span className="block mt-2 text-xl text-white font-bold mb-1">
        {selectedDescription === 'game' && gameData?.correctGame}
        {selectedDescription === 'movie' && gameData?.correctMovie}
        {selectedDescription === 'tv' && gameData?.correctTVShow}
      </span>
    </p>
    <p className="text-sm sm:text-base text-white/80">
      You&apos;ve run out of attempts to decrypt the {selectedDescription}.
    </p>
    <button
      onClick={onClose}
      className="w-full sm:w-auto px-6 py-2
                text-white/90 tracking-[0.2em]
                border border-red/20 rounded-md
                bg-zinc-950/50
                hover:bg-zinc-950/70 hover:border-white/30
                focus:outline-none focus:border-white/40
                focus:ring-2 focus:ring-white/20
                transition-all duration-300"
    >
      Close
    </button>
  </Modal>
);

FailModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedDescription: PropTypes.string,
  gameData: PropTypes.object
};

export default memo(FailModal);