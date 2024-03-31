let darkMode = localStorage.getItem('darkMode');
const themeToggleBtn = document.getElementById('theme-toggle');

themeToggleBtn.addEventListener('click', function() {
    const currentTheme = document.documentElement.classList.contains('theme-dark') ? 'dark' : 'light';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

    // Log the current theme before the change
    console.log('Current theme:', currentTheme);

    document.documentElement.classList.remove(`theme-${currentTheme}`);
    document.documentElement.classList.add(`theme-${newTheme}`);

    // Log the new theme after the change
    console.log('New theme:', newTheme);

    localStorage.setItem('theme', newTheme);
});
  

if (localStorage.theme === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    document.querySelector('body').classList.add('theme-dark')
  }
