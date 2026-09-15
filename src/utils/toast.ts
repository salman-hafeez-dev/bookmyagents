import { toast, type ToastOptions } from 'react-toastify';

export const showToast = {
  success: (message: string, options?: ToastOptions) => {
    toast.success(message, {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options,
    });
  },

  error: (message: string, options?: ToastOptions) => {
    toast.error(message, {
      position: 'top-right',
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options,
    });
  },

  info: (message: string, options?: ToastOptions) => {
    toast.info(message, {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options,
    });
  },

  warning: (message: string, options?: ToastOptions) => {
    toast.warning(message, {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      ...options,
    });
  },

  loading: (message: string) => {
    return toast.loading(message, {
      position: 'top-right',
      hideProgressBar: false,
      closeOnClick: false,
      pauseOnHover: false,
      draggable: false,
    });
  },

  promise: <T,>(promise: Promise<T>, messages: { pending: string; success: string; error: string }, options?: ToastOptions) => {
    return toast.promise(
      promise,
      {
        pending: {
          render: messages.pending,
        },
        success: {
          render: messages.success,
        },
        error: {
          render: messages.error,
        },
      },
      {
        position: 'top-right',
        autoClose: 3000,
        ...options,
      }
    );
  },
};

// Helper to extract error message from various error types
export const getErrorMessage = (error: any): string => {
  if (typeof error === 'string') return error;
  if (error?.response?.data?.message) return error.response.data.message;
  if (error?.response?.data?.error) return error.response.data.error;
  if (error?.message) return error.message;
  return 'Something went wrong. Please try again.';
};
