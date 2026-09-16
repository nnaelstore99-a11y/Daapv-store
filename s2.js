
function applyThemeToDOM(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    const landingToggle = document.getElementById('landingThemeToggle');
    if (landingToggle) {
        if (theme === 'dark') landingToggle.classList.add('dark');
        else landingToggle.classList.remove('dark');
    }
    const dashToggleSmall = document.getElementById('themeToggleSmall');
    if (dashToggleSmall) {
        dashToggleSmall.style.color = theme === 'dark' ? 'var(--gold)' : 'var(--spiderman-blue)';
    }
}
function toggleTheme() {
    const current = document.documentElement.getAttribute('data-theme') || 'light';
    const next = current === 'light' ? 'dark' : 'light';
    localStorage.setItem('4vell_theme', next);
    applyThemeToDOM(next);
    if (document.getElementById('dashboardWrapper') &&
        document.getElementById('dashboardWrapper').style.display !== 'none') {
        if (typeof showToast === 'function') {
            showToast(next === 'dark' ? '🌙 Mode Gelap diaktifkan' : '☀️ Mode Terang diaktifkan', '#A78BFA');
        }
    }
}
function loadSavedTheme() {
    let saved = localStorage.getItem('4vell_theme');
    if (!saved) {
        saved = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    }
    applyThemeToDOM(saved);
}
(function() {
    var saved = localStorage.getItem('4vell_theme');
    if (!saved) {
        saved = (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
    }
    document.documentElement.setAttribute('data-theme', saved);
})();
