// Configuração da API
const API_URL = 'http://localhost:3000/api';

// Funções de autenticação
const auth = {
    // Salvar token no localStorage
    saveToken(token) {
        localStorage.setItem('token', token);
    },

    // Obter token do localStorage
    getToken() {
        return localStorage.getItem('token');
    },

    // Remover token (logout)
    removeToken() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    // Salvar informações do usuário
    saveUser(user) {
        localStorage.setItem('user', JSON.stringify(user));
    },

    // Obter informações do usuário
    getUser() {
        const userStr = localStorage.getItem('user');
        return userStr ? JSON.parse(userStr) : null;
    },

    // Verificar se está autenticado
    isAuthenticated() {
        return !!this.getToken();
    },

    // Verificar se é admin
    isAdmin() {
        const user = this.getUser();
        return user && user.role === 'admin';
    },

    // Obter headers com token para requisições
    getAuthHeaders() {
        const token = this.getToken();
        return {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : ''
        };
    },

    // Fazer logout
    logout() {
        this.removeToken();
        window.location.href = 'login.html';
    }
};

// Função para registrar novo usuário
async function registerUser(username, email, password) {
    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, email, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Erro ao registrar usuário');
        }

        // Salvar token e informações do usuário
        auth.saveToken(data.token);
        auth.saveUser(data.user);

        return data;
    } catch (error) {
        throw error;
    }
}

// Função para fazer login
async function loginUser(username, password) {
    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Credenciais inválidas');
        }

        // Salvar token e informações do usuário
        auth.saveToken(data.token);
        auth.saveUser(data.user);

        return data;
    } catch (error) {
        throw error;
    }
}

// Função para verificar autenticação e redirecionar se necessário
function requireAuth(requireAdmin = false) {
    if (!auth.isAuthenticated()) {
        window.location.href = 'login.html';
        return false;
    }

    if (requireAdmin && !auth.isAdmin()) {
        alert('Acesso negado. Apenas administradores podem acessar esta página.');
        window.location.href = 'index.html';
        return false;
    }

    return true;
}

// Função para exibir mensagens de erro/sucesso
function showMessage(message, type = 'error') {
    // Remover mensagens anteriores
    const existingMessage = document.querySelector('.auth-message');
    if (existingMessage) {
        existingMessage.remove();
    }

    // Criar nova mensagem
    const messageDiv = document.createElement('div');
    messageDiv.className = `auth-message ${type}`;
    messageDiv.textContent = message;
    messageDiv.style.cssText = `
        padding: 1rem;
        margin: 1rem 0;
        border-radius: 5px;
        text-align: center;
        font-weight: bold;
        ${type === 'error' 
            ? 'background-color: #f44336; color: white;' 
            : 'background-color: #4CAF50; color: white;'
        }
    `;

    // Inserir antes do formulário
    const form = document.querySelector('form');
    if (form) {
        form.parentNode.insertBefore(messageDiv, form);
    } else {
        document.body.insertBefore(messageDiv, document.body.firstChild);
    }

    // Remover após 5 segundos
    setTimeout(() => {
        if (messageDiv.parentNode) {
            messageDiv.remove();
        }
    }, 5000);
}

