document.addEventListener('DOMContentLoaded', function () {
    const nav = document.querySelector('nav');
    const btn = nav && nav.querySelector('.hamburger');
    const menu = nav && nav.querySelector('#main-navigation');

    if (!nav || !btn || !menu) return;

    btn.addEventListener('click', function () {
        const isOpen = nav.classList.toggle('open');
        btn.setAttribute('aria-expanded', String(isOpen));
    });

    // Fecha ao clicar num link (mobile)
    menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', () => {
            if (nav.classList.contains('open')) {
                nav.classList.remove('open');
                btn.setAttribute('aria-expanded', 'false');
            }
        });
    });

    // Fecha ao clicar fora do nav
    document.addEventListener('click', (e) => {
        if (!nav.classList.contains('open')) return;
        if (!nav.contains(e.target)) {
            nav.classList.remove('open');
            btn.setAttribute('aria-expanded', 'false');
        }
    });
});