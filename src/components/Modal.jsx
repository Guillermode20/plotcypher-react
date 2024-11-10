import { memo } from 'react';
import PropTypes from 'prop-types';

const Modal = ({ children, isOpen, onClose, variant = 'default' }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div 
        className="fixed inset-0 bg-black/70 backdrop-blur-sm" 
        onClick={onClose}
      ></div>
      <div className={`relative bg-zinc-950 border ${
        variant === 'error' ? 'border-red-500' : 'border-white/20'
      } rounded-lg p-8 max-w-md w-full m-4 shadow-xl`}>
        {children}
      </div>
    </div>
  );
};

Modal.propTypes = {
  children: PropTypes.node.isRequired,
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(['default', 'error'])
};

export default memo(Modal);