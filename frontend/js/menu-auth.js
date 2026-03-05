//Menu para todas as pag com o fetch

    fetch("Menu.html")
      .then(response => response.text())
      .then(data => {
        document.getElementById("menu").innerHTML = data;
        
        // Disparar evento após carregar o menu
        document.dispatchEvent(new Event('menuLoaded'));
      })
      .catch(error => {
        console.error('Erro ao carregar menu:', error);
        document.getElementById("menu").innerHTML = '<p>Erro ao carregar menu</p>';
      });
  

// Script para gerenciar o menu baseado no estado de autenticação
document.addEventListener('menuLoaded', () => {
    // Verificar se auth está disponível
    if (typeof auth === 'undefined') {
        console.warn('auth.js não foi carregado. Menu de autenticação não será atualizado.');
        return;
    }

    const nav = document.querySelector('nav ul');
    if (!nav) return;

    const isAuthenticated = auth.isAuthenticated();
    const user = auth.getUser();
    const isAdmin = user && user.role === 'admin';

    // Encontrar ou criar elementos do menu
    let loginItem = null;
    let adminItem = null;
    let logoutItem = null;

    // Procurar itens existentes
    nav.querySelectorAll('li').forEach(li => {
        const link = li.querySelector('a');
        if (link) {
            if (link.getAttribute('href') === 'login.html' || link.textContent.trim() === 'Login') {
                loginItem = li;
            }
            if (link.getAttribute('href') === 'admin.html' || link.textContent.trim() === 'Admin') {
                adminItem = li;
            }
            if (link.id === 'logoutBtn' || link.textContent.trim() === 'Logout') {
                logoutItem = li;
            }
        }
    });

    // Gerenciar link de Admin
    if (adminItem) {
        if (!isAdmin) {
            // Esconder link Admin se não for admin
            adminItem.style.display = 'none';
        } else {
            // Mostrar link Admin se for admin
            adminItem.style.display = '';
        }
    }

    // Gerenciar Login/Logout
    if (isAuthenticated) {
        // Usuário está logado - mostrar Logout
        if (loginItem) {
            // Substituir Login por Logout
            const link = loginItem.querySelector('a');
            if (link) {
                link.textContent = 'Logout';
                link.href = '#';
                link.id = 'logoutBtn';
                link.style.cursor = 'pointer';
                link.style.color = '#f44336';
                
                // Remover todos os event listeners anteriores
                const newLink = link.cloneNode(true);
                loginItem.replaceChild(newLink, link);
                
                // Adicionar event listener para logout
                newLink.addEventListener('click', (e) => {
                    e.preventDefault();
                    if (confirm('Tem certeza que deseja sair?')) {
                        auth.logout();
                    }
                });
            }
        }
        
        // Remover logoutItem duplicado se existir
        if (logoutItem && logoutItem !== loginItem) {
            logoutItem.remove();
        }
        
        // Criar logout se não existir nenhum
        if (!loginItem && !logoutItem) {
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = '#';
            a.id = 'logoutBtn';
            a.textContent = 'Logout';
            a.style.color = '#f44336';
            a.style.cursor = 'pointer';
            a.addEventListener('click', (e) => {
                e.preventDefault();
                if (confirm('Tem certeza que deseja sair?')) {
                    auth.logout();
                }
            });
            li.appendChild(a);
            nav.appendChild(li);
        }
    } else {
        // Usuário não está logado - mostrar Login
        // Remover logout se existir
        if (logoutItem) {
            const link = logoutItem.querySelector('a');
            if (link && link.id === 'logoutBtn') {
                link.textContent = 'Login';
                link.href = 'login.html';
                link.id = '';
                link.style.color = '';
                link.style.cursor = '';
                link.removeEventListener('click', () => {});
            }
        }
        
        // Garantir que Login está visível
        if (loginItem) {
            loginItem.style.display = '';
            const link = loginItem.querySelector('a');
            if (link) {
                link.href = 'login.html';
                link.textContent = 'Login';
                link.id = '';
                link.style.color = '';
                link.style.cursor = '';
            }
        } else if (!logoutItem || logoutItem.querySelector('a')?.id === 'logoutBtn') {
            // Criar item de login se não existir
            const li = document.createElement('li');
            const a = document.createElement('a');
            a.href = 'login.html';
            a.textContent = 'Login';
            li.appendChild(a);
            nav.appendChild(li);
        }
    }

    // Mostrar nome do usuário logado (opcional)
    if (isAuthenticated && user) {
        // Verificar se já existe um item com o nome do usuário
        let userInfoItem = null;
        nav.querySelectorAll('li').forEach(li => {
            if (li.id === 'userInfo') {
                userInfoItem = li;
            }
        });

        if (!userInfoItem) {
            // Criar item com nome do usuário (antes do logout)
            userInfoItem = document.createElement('li');
            userInfoItem.id = 'userInfo';
            const span = document.createElement('span');
            span.textContent = user.username;
            span.style.color = '#22c55e';
            span.style.marginRight = '1rem';
            userInfoItem.appendChild(span);
            
            // Inserir antes do logout/login
            const logoutLink = nav.querySelector('#logoutBtn')?.parentElement || nav.querySelector('a[href="login.html"]')?.parentElement;
            if (logoutLink) {
                nav.insertBefore(userInfoItem, logoutLink);
            } else {
                nav.appendChild(userInfoItem);
            }
        }
    } else {
        // Remover item de informação do usuário se não estiver logado
        const userInfoItem = nav.querySelector('#userInfo');
        if (userInfoItem) {
            userInfoItem.remove();
        }
    }
});

// Menu toggle
function initializeMenuToggle() {
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

    // --- Mudar fundo do menu ao fazer scroll (desktop e mobile) ---
    const SCROLL_THRESHOLD = 50; // px

    function updateNavOnScroll() {
        if (window.scrollY > SCROLL_THRESHOLD) {
            nav.classList.add('scrolled');
        } else {
            nav.classList.remove('scrolled');
        }
    }

    // Atualiza imediatamente (caso a página abra já com scroll)
    updateNavOnScroll();
    window.addEventListener('scroll', updateNavOnScroll);
}

// Aguardar pelo menu ser carregado via fetch
document.addEventListener('menuLoaded', function() {
    initializeMenuToggle();
});

// Também tentar inicializar se o menu já estiver presente (para compatibilidade)
document.addEventListener('DOMContentLoaded', function () {
    if (document.querySelector('nav')) {
        initializeMenuToggle();
    }
});
