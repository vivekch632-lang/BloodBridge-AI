let toastListener = null;

export const showToast = (message, type = 'success', duration = 3500) => {
  if (toastListener) {
    toastListener({ id: Date.now(), message, type, duration });
  }
};

export const registerToastListener = (listener) => {
  toastListener = listener;
  return () => {
    toastListener = null;
  };
};
