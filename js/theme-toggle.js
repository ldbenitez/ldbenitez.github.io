/**
 * Dark/Light Theme Toggle
 */
(function() {
  const STORAGE_KEY = 'theme';
  const SUN = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>';
  const MOON = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
  const COLORS = { light: '#faf6f0', dark: '#1a1714' };

  const prefersDark = matchMedia('(prefers-color-scheme: dark)');
  const getTheme = () => localStorage.getItem(STORAGE_KEY) || (prefersDark.matches ? 'dark' : 'light');

  function setTheme(theme) {
    document.body.dataset.theme = theme;
    localStorage.setItem(STORAGE_KEY, theme);
    const btn = document.querySelector('.theme-toggle');
    if (btn) {
      btn.innerHTML = theme === 'light' ? MOON : SUN;
      btn.setAttribute('aria-label', `Switch to ${theme === 'light' ? 'dark' : 'light'} mode`);
    }
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', COLORS[theme]);
    // Switch syntax highlighting theme
    const syntaxLink = document.getElementById('syntax-theme');
    if (syntaxLink) {
      syntaxLink.href = syntaxLink.href.replace(/syntax-(dark|light)\.css/, `syntax-${theme}.css`);
    }
  }

  function init() {
    const menu = document.querySelector('.main-menu-items');
    if (!menu) return;

    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.className = 'theme-toggle';
    btn.type = 'button';
    btn.addEventListener('click', () => setTheme(document.body.dataset.theme === 'light' ? 'dark' : 'light'));
    li.appendChild(btn);
    menu.appendChild(li);

    setTheme(getTheme());
  }

  document.body.dataset.theme = getTheme();
  document.readyState === 'loading' ? document.addEventListener('DOMContentLoaded', init) : init();
  prefersDark.addEventListener('change', () => !localStorage.getItem(STORAGE_KEY) && setTheme(getTheme()));
})();
