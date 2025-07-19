import toast from 'react-hot-toast';

/**
 * Show a success toast with a consistent style.
 * @param {string} message
 */
export const showSuccessToast = (message) => {
  toast.success(message, {
    style: {
      background: '#2d3748',
      color: '#fff',
      border: '1px solid #48bb78',
    },
  });
};

/**
 * Show an error toast with a consistent style.
 * @param {string} message
 */
export const showErrorToast = (message) => {
  toast.error(message, {
    style: {
      background: '#2d3748',
      color: '#fff',
      border: '1px solid #f56565',
    },
  });
};

/**
 * Show an info toast with a consistent style.
 * @param {string} message
 */
export const showInfoToast = (message) => {
  toast(message, {
    icon: 'ℹ️',
    style: {
      background: '#2d3748',
      color: '#fff',
      border: '1px solid #4299e1',
    },
  });
}; 