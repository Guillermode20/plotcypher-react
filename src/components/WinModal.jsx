import { memo } from 'react';
import PropTypes from 'prop-types';
import Modal from './Modal';  

const WinModal = ({ isOpen, onClose, selectedDescription, gameState, gameData }) => (
  <Modal isOpen={isOpen} onClose={onClose} variant="success">
    <h2 className="text-2xl font-bold text-green-500 mb-4">DECRYPTION SUCCEEDED</h2>
    <p className="text-white/80 mb-6">
      Congratulations! You successfully decrypted the{' '}
      {selectedDescription === 'game' && 'game'}
      {selectedDescription === 'movie' && 'movie'}
      {selectedDescription === 'tv' && 'TV show'} in{' '}
      {gameState.attempts[selectedDescription] + 1} attempt(s).
      <span className="block mt-2 text-xl text-white font-bold mb-1">
        {selectedDescription === 'game' && gameData?.correctGame}
        {selectedDescription === 'movie' && gameData?.correctMovie}
        {selectedDescription === 'tv' && gameData?.correctTVShow}
      </span>
      <span className="block mt-2 text-white/80">
        Come back tomorrow for a new challenge!
      </span>
    </p>
    <button
      onClick={onClose}
      className="w-full sm:w-auto px-6 py-2
                text-white/90 tracking-[0.2em]
                border border-green-500/20 rounded-md
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

WinModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  selectedDescription: PropTypes.string,
  gameState: PropTypes.object.isRequired,
  gameData: PropTypes.object
};

export default memo(WinModal);