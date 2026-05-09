import { create } from 'zustand';

const useToastStore = create((set) => ({
  isVisible: false,
  message: '',
  subMessage: '',
  showToast: (message, subMessage = 'Everything seems great') => {
    set({ isVisible: true, message, subMessage });
    setTimeout(() => {
      set({ isVisible: false });
    }, 4000); // Auto-hide after 4 seconds
  },
  hideToast: () => set({ isVisible: false }),
}));

export default useToastStore;
