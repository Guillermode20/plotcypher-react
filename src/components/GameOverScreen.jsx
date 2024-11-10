import { Suspense } from 'react';
import PropTypes from 'prop-types';
import CountdownTimer from './CountdownTimer';

const GameOverScreen = ({ gameState, category }) => (
  <div className="text-center p-8 border border-white/20 rounded-md bg-zinc-950/50">
    {gameState.levels[category] > -1 ? (
      <p className="text-2xl text-green-500 mb-4">
        Decrypted in {gameState.attempts[category] + 1} attempts!
      </p>
    ) : (
      <p className="text-2xl text-red-500 mb-4">
        Decryption failed after 5 attempts
      </p>
    )}
    <p className="text-2xl text-white/90">
      Next {category} in <Suspense fallback="...">{<CountdownTimer />}</Suspense>
    </p>
  </div>
);

GameOverScreen.propTypes = {
  gameState: PropTypes.shape({
    levels: PropTypes.object.isRequired,
    attempts: PropTypes.object.isRequired
  }).isRequired,
  category: PropTypes.string.isRequired
};

export default GameOverScreen;