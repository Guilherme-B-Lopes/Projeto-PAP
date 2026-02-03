document.addEventListener('DOMContentLoaded', function () {
    const nav = document.querySelector('nav');
    const btn = nav && nav.querySelector('.hamburger');
    const menu = nav && nav.querySelector('#main-navigation');

    if (!nav || !btn || !menu) return;

    btn.addEventListener('click', function () {
        const isOpen = nav.classList.toggle('open');
        btn.setAttribute('aria-expanded', String(isOpen));
    });

    // --- Lógica do Submenu (Mobile) ---
    const submenuToggles = document.querySelectorAll('.submenu-toggle');
    
    submenuToggles.forEach(toggle => {
        toggle.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation(); // Impede que o clique feche o menu principal
            
            const parent = toggle.closest('.submenu-parent');
            const isOpen = parent.classList.toggle('open');
            toggle.setAttribute('aria-expanded', String(isOpen));
            console.log('Submenu toggle clicked. isOpen:', isOpen, 'parent:', parent);
        });
    });

    // Fecha ao clicar num link (mobile) - EXCETO links do submenu
    menu.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', (e) => {
            // Se for um link dentro do submenu, não fechar o menu principal
            if (link.closest('.submenu')) {
                return;
            }
            
            if (nav.classList.contains('open')) {
                nav.classList.remove('open');
                btn.setAttribute('aria-expanded', 'false');
            }
        });
    });

    // Fechar submenu ao clicar num link dentro dele
    document.querySelectorAll('.submenu a').forEach(link => {
        link.addEventListener('click', () => {
            document.querySelectorAll('.submenu-parent').forEach(parent => {
                parent.classList.remove('open');
            });
            submenuToggles.forEach(toggle => {
                toggle.setAttribute('aria-expanded', 'false');
            });
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