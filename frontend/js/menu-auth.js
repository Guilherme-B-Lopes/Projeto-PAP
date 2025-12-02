// Script para gerenciar o menu baseado no estado de autenticação
document.addEventListener('DOMContentLoaded', () => {
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
            span.style.color = '#FCA311';
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

