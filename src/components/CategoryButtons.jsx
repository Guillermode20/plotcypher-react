import { memo } from 'react';
import PropTypes from 'prop-types';

const CategoryButtons = memo(({ selectedDescription, onSelect }) => (
  <div className="flex w-full rounded-md shadow-sm mb-4" role="group">
    {['game', 'movie', 'tv'].map((category) => (
      <button
        key={category}
        onClick={() => onSelect(category)}
        className={`flex-1 px-6 py-2 tracking-[0.2em] border border-white/30 
          ${category === 'game' ? 'rounded-l-md' : category === 'tv' ? 'rounded-r-md' : ''} 
          bg-zinc-950 hover:bg-zinc-950 hover:border-white/30 
          focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/20 
          transition-all duration-300 
          ${selectedDescription === category ? 'text-white/90 bg-zinc-950 border-white/30' : 'text-white/50'}`}
      >
        {category.charAt(0).toUpperCase() + category.slice(1)}
      </button>
    ))}
  </div>
));

CategoryButtons.propTypes = {
  selectedDescription: PropTypes.string,
  onSelect: PropTypes.func.isRequired,
};

CategoryButtons.displayName = 'CategoryButtons';

export default CategoryButtons;