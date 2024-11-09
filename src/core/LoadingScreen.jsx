import { memo } from 'react';

const LoadingScreen = memo(() => (
  <div className="fixed inset-0 bg-zinc-950 flex items-center justify-center">
    <div className="text-center space-y-4">
      {/* Monochrome spinning loader */}
      <div className="w-16 h-16 border-4 border-white/20 border-t-white/80 rounded-full animate-spin mx-auto"></div>
      
      {/* Simple loading text without animation */}
      <p className="text-white/60 font-medium tracking-wider text-sm">
        LOADING
      </p>
    </div>
  </div>
));

LoadingScreen.displayName = 'LoadingScreen';

export default LoadingScreen;