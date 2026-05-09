import { create } from 'zustand';

const useThemeStore = create((set, get) => ({
  isDark: localStorage.getItem('theme') === 'dark' || 
          (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches),
  
  toggleTheme: () => {
    const newDark = !get().isDark;
    get().setTheme(newDark);
  },
  
  setTheme: (dark) => {
    if (dark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
    set({ isDark: dark });
  }
}));

export default useThemeStore;
