// admin.js
document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000/api';
    
    // Função auxiliar para fazer requisições autenticadas
    function fetchWithAuth(url, options = {}) {
        const headers = auth.getAuthHeaders();
        return fetch(url, {
            ...options,
            headers: {
                ...headers,
                ...options.headers
            }
        });
    }

    // --- Lógica de Gerenciamento de Projetos ---
    const adminProjectList = document.getElementById('adminProjectList');
    const editProjectModal = document.getElementById('editProjectModal');
    const closeEditModalButtons = document.querySelectorAll('.close-edit-modal');
    const editProjectForm = document.getElementById('editProjectForm');

    let projects = []; // Array para armazenar os projetos do backend

    // Função para carregar projetos do backend
    async function loadProjects() {
        try {
            const response = await fetch(`${API_URL}/projects`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            projects = await response.json();
            renderAdminProjects();
        } catch (error) {
            console.error('Erro ao carregar projetos:', error);
            adminProjectList.innerHTML = '<tr><td colspan="7" style="text-align: center; color: red;">Erro ao carregar projetos. Verifique o servidor.</td></tr>';
        }
    }

    // Função para renderizar os projetos na tabela de administração
    function renderAdminProjects() {
        adminProjectList.innerHTML = ''; // Limpa a lista existente

        if (projects.length === 0) {
            adminProjectList.innerHTML = '<tr><td colspan="7" style="text-align: center;">Nenhum projeto cadastrado.</td></tr>';
            return;
        }

        projects.forEach((project) => {
            const row = adminProjectList.insertRow();
            row.classList.add(project.category + '-row'); // Adiciona classe para estilização por categoria (ex.: completo-row)
            const thumbSrc = Array.isArray(project.images) && project.images.length ? project.images[0] : (project.image || '');
            row.innerHTML = `
                <td data-label="ID">${project._id}</td>
                <td data-label="Imagem"><img src="${thumbSrc}" alt="${project.name}"></td>
                <td data-label="Nome">${project.name}</td>
                <td data-label="Turma">${project.turma}</td> <!-- Novo: Turma em vez de Preço -->
                <td data-label="Categoria">${project.category.charAt(0).toUpperCase() + project.category.slice(1)}</td> <!-- Novo: Categoria -->
                <td data-label="Descrição">${project.description}</td>
                <td data-label="Ações" class="actions">
                    <button style="margin: 5px; cursor: pointer;" class="edit-btn" data-id="${project._id}">Editar</button>
                    <button class="delete-btn" data-id="${project._id}">Eliminar</button>
                </td>
            `;
        });

        // Adiciona event listeners para os botões de Editar e Excluir
        document.querySelectorAll('.project-management-table .edit-btn').forEach(button => {
            button.addEventListener('click', (event) => openEditModal(event.target.dataset.id));
        });
        document.querySelectorAll('.project-management-table .delete-btn').forEach(button => {
            button.addEventListener('click', (event) => deleteProject(event.target.dataset.id));
        });
    }

    // Função para abrir o modal de edição de projeto
    function openEditModal(projectId) {
        const project = projects.find(p => p._id === projectId);
        if (!project) return;

        document.getElementById('editProjectId').value = project._id;
        document.getElementById('editProjectName').value = project.name;
        document.getElementById('editProjectTurma').value = project.turma; // Novo: turma
        document.getElementById('editProjectCategory').value = project.category; // Novo: categoria
        document.getElementById('editProjectDescription').value = project.description;
        document.getElementById('editProjectImage').value = project.image;

        editProjectModal.style.display = 'block';
        document.body.style.overflow = 'hidden'; // Impede o scroll do body
    }

    // Função para fechar o modal de edição de projeto
    function closeEditModal() {
        editProjectModal.style.display = 'none';
        document.body.style.overflow = ''; // Restaura o scroll do body
    }

    // Event listeners para fechar o modal de edição
    closeEditModalButtons.forEach(button => {
        button.addEventListener('click', closeEditModal);
    });
    window.addEventListener('click', (event) => {
        if (event.target === editProjectModal) {
            closeEditModal();
        }
    });
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeEditModal();
        }
    });

    // Lidar com o envio do formulário de edição de projeto
    editProjectForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const projectId = document.getElementById('editProjectId').value;
        const name = document.getElementById('editProjectName').value;
        const turma = document.getElementById('editProjectTurma').value; // Novo: turma
        const category = document.getElementById('editProjectCategory').value; // Novo: categoria
        const description = document.getElementById('editProjectDescription').value;
        const image = document.getElementById('editProjectImage').value;

        if (!name || !turma || !category || !description || !image) {
            alert('Por favor, preencha todos os campos obrigatórios!');
            return;
        }

        const updatedProjectData = { name, turma, category, description, image };

        try {
            const response = await fetchWithAuth(`${API_URL}/projects/${projectId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatedProjectData)
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const updatedProject = await response.json();
            alert('Projeto atualizado com sucesso!');
            closeEditModal();
            loadProjects(); // Recarrega a lista de projetos
        } catch (error) {
            console.error('Erro ao atualizar projeto:', error);
            alert('Erro ao atualizar projeto. Verifique o console para mais detalhes.');
        }
    });

    // Função para excluir um projeto
    async function deleteProject(projectId) {
        const project = projects.find(p => p._id === projectId);
        if (!project) return;

        if (confirm(`Tem certeza que deseja excluir o projeto "${project.name}"?`)) {
            try {
                const response = await fetchWithAuth(`${API_URL}/projects/${projectId}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }

                const result = await response.json();
                alert('Projeto excluído com sucesso!');
                loadProjects(); // Recarrega a lista de projetos
            } catch (error) {
                console.error('Erro ao excluir projeto:', error);
                alert('Erro ao excluir projeto. Verifique o console para mais detalhes.');
            }
        }
    }

    // Carrega os projetos quando a página é carregada
    loadProjects();

    // --- Lógica de Gerenciamento de Eventos (permanece igual à versão anterior) ---
    const eventForm = document.getElementById('eventForm');
    const eventIdInput = document.getElementById('eventId');
    const eventTitleInput = document.getElementById('eventTitle');
    const eventDateInput = document.getElementById('eventDate');
    const eventTimeInput = document.getElementById('eventTime');
    const addEventBtn = eventForm.querySelector('.add-event-btn');
    const cancelEventEditBtn = eventForm.querySelector('.cancel-event-edit-btn');
    const adminEventTableBody = document.getElementById('adminEventTableBody');

    let events = []; // Array para armazenar os eventos do backend

    // Função para carregar eventos do backend
    async function loadEvents() {
        try {
            const response = await fetch(`${API_URL}/events`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            events = await response.json();
            renderEventTable();
        } catch (error) {
            console.error('Erro ao carregar eventos:', error);
            adminEventTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center; color: red;">Erro ao carregar eventos. Verifique o servidor.</td></tr>';
        }
    }

    // Função para renderizar a tabela de eventos
    function renderEventTable() {
        adminEventTableBody.innerHTML = '';

        if (events.length === 0) {
            adminEventTableBody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Nenhum evento cadastrado.</td></tr>';
            return;
        }

        // Ordena os eventos por data e hora
        events.sort((a, b) => {
            const dateA = new Date(`${a.date}T${a.time}`);
            const dateB = new Date(`${b.date}T${b.time}`);
            return dateA - dateB;
        });

        events.forEach((event) => {
            const row = adminEventTableBody.insertRow();
            row.innerHTML = `
                <td data-label="ID">${event._id}</td>
                <td data-label="Título">${event.title}</td>
                <td data-label="Data">${formatDateToDisplay(event.date)}</td>
                <td data-label="Hora">${event.time}</td>
                <td data-label="Ações" class="actions">
                    <button class="edit-btn" data-id="${event._id}">Editar</button>
                    <button class="delete-btn" data-id="${event._id}">Elminar</button>
                </td>
            `;
        });

        // Adiciona event listeners para os botões de Editar e Excluir
        document.querySelectorAll('.event-management-table .edit-btn').forEach(button => {
            button.addEventListener('click', (e) => editEvent(e.target.dataset.id));
        });
        document.querySelectorAll('.event-management-table .delete-btn').forEach(button => {
            button.addEventListener('click', (e) => deleteEvent(e.target.dataset.id));
        });
    }

    // Função auxiliar para formatar data para exibição (DD/MM/YYYY)
    function formatDateToDisplay(dateString) {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    }

    // Lidar com o envio do formulário de eventos
    eventForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const id = eventIdInput.value;
        const title = eventTitleInput.value;
        const date = eventDateInput.value;
        const time = eventTimeInput.value;

        if (!title || !date || !time) {
            alert('Por favor, preencha todos os campos do evento!');
            return;
        }

        const eventData = { title, date, time };

        try {
            let response;
            if (id) { // Editando evento existente
                response = await fetchWithAuth(`${API_URL}/events/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(eventData)
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                alert('Evento atualizado com sucesso!');
            } else { // Adicionando novo evento
                response = await fetchWithAuth(`${API_URL}/events`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(eventData)
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                alert('Evento adicionado com sucesso!');
            }

            eventForm.reset();
            eventIdInput.value = '';
            addEventBtn.textContent = 'Salvar Evento';
            cancelEventEditBtn.style.display = 'none';
            loadEvents(); // Recarrega a lista de eventos
        } catch (error) {
            console.error('Erro ao salvar evento:', error);
            alert('Erro ao salvar evento. Verifique o console para mais detalhes.');
        }
    });

    // Função para editar um evento
    function editEvent(id) {
        const eventToEdit = events.find(event => event._id === id);
        if (eventToEdit) {
            eventIdInput.value = eventToEdit._id;
            eventTitleInput.value = eventToEdit.title;
            eventDateInput.value = eventToEdit.date;
            eventTimeInput.value = eventToEdit.time;
            addEventBtn.textContent = 'Atualizar Evento';
            cancelEventEditBtn.style.display = 'inline-block';
        }
    }

    // Função para cancelar edição
    cancelEventEditBtn.addEventListener('click', () => {
        eventForm.reset();
        eventIdInput.value = '';
        addEventBtn.textContent = 'Salvar Evento';
        cancelEventEditBtn.style.display = 'none';
    });

    // Função para excluir um evento
    async function deleteEvent(id) {
        if (confirm('Tem certeza que deseja excluir este evento?')) {
            try {
                const response = await fetchWithAuth(`${API_URL}/events/${id}`, {
                    method: 'DELETE'
                });
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                alert('Evento excluído com sucesso!');
                loadEvents(); // Recarrega a lista de eventos
            } catch (error) {
                console.error('Erro ao excluir evento:', error);
                alert('Erro ao excluir evento. Verifique o console para mais detalhes.');
            }
        }
    }

    // --- Lógica de Gerenciamento de Utilizadores ---
    const adminUserTableBody = document.getElementById('adminUserTableBody');
    const editUserModal = document.getElementById('editUserModal');
    const closeEditUserModalButtons = document.querySelectorAll('.close-edit-user-modal');
    const editUserForm = document.getElementById('editUserForm');

    let users = []; // Array para armazenar os utilizadores

    // Função para carregar utilizadores
    async function loadUsers() {
        try {
            const response = await fetchWithAuth(`${API_URL}/users`);
            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            users = await response.json();
            renderUsers();
        } catch (error) {
            console.error('Erro ao carregar utilizadores:', error);
            adminUserTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: red;">Erro ao carregar utilizadores. Verifique o servidor.</td></tr>';
        }
    }

    // Função para renderizar utilizadores na tabela
    function renderUsers() {
        adminUserTableBody.innerHTML = '';

        if (users.length === 0) {
            adminUserTableBody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Nenhum utilizador cadastrado.</td></tr>';
            return;
        }

        users.forEach((user) => {
            const row = adminUserTableBody.insertRow();
            const createdDate = new Date(user.createdAt).toLocaleDateString('pt-PT');
            const roleBadgeClass = user.role === 'admin' ? 'badge-admin' : 'badge-user';
            const roleText = user.role === 'admin' ? 'Administrador' : 'Utilizador';

            row.innerHTML = `
                <td data-label="ID">${user._id}</td>
                <td data-label="Username">${user.username}</td>
                <td data-label="Email">${user.email}</td>
                <td data-label="Role"><span class="${roleBadgeClass}">${roleText}</span></td>
                <td data-label="Data de Criação">${createdDate}</td>
                <td data-label="Ações" class="actions">
                    <button class="edit-btn" data-id="${user._id}">Editar</button>
                    <button class="delete-btn" data-id="${user._id}">Eliminar</button>
                </td>
            `;
        });

        // Adicionar event listeners
        document.querySelectorAll('.users-management-table .edit-btn').forEach(button => {
            button.addEventListener('click', (event) => openEditUserModal(event.target.dataset.id));
        });
        document.querySelectorAll('.users-management-table .delete-btn').forEach(button => {
            button.addEventListener('click', (event) => deleteUser(event.target.dataset.id));
        });
    }

    // Função para abrir modal de edição de utilizador
    function openEditUserModal(userId) {
        const user = users.find(u => u._id === userId);
        if (!user) return;

        document.getElementById('editUserId').value = user._id;
        document.getElementById('editUserUsername').value = user.username;
        document.getElementById('editUserEmail').value = user.email;
        document.getElementById('editUserRole').value = user.role;
        document.getElementById('editUserPassword').value = '';

        editUserModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    // Função para fechar modal de utilizador
    function closeEditUserModal() {
        editUserModal.style.display = 'none';
        document.body.style.overflow = '';
    }

    // Event listeners para fechar modal de utilizador
    closeEditUserModalButtons.forEach(button => {
        button.addEventListener('click', closeEditUserModal);
    });

    // Fechar modal ao clicar fora
    window.addEventListener('click', (event) => {
        if (event.target === editUserModal) {
            closeEditUserModal();
        }
    });

    // Submit do formulário de edição de utilizador
    editUserForm.addEventListener('submit', async (event) => {
        event.preventDefault();

        const userId = document.getElementById('editUserId').value;
        const username = document.getElementById('editUserUsername').value;
        const email = document.getElementById('editUserEmail').value;
        const role = document.getElementById('editUserRole').value;
        const password = document.getElementById('editUserPassword').value;

        const updateData = { username, email, role };
        if (password) updateData.password = password;

        try {
            const response = await fetchWithAuth(`${API_URL}/users/${userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
            
            alert('Utilizador atualizado com sucesso!');
            closeEditUserModal();
            loadUsers();
        } catch (error) {
            console.error('Erro ao atualizar utilizador:', error);
            alert('Erro ao atualizar utilizador. Verifique o console para mais detalhes.');
        }
    });

    // Função para deletar utilizador
    async function deleteUser(userId) {
        const user = users.find(u => u._id === userId);
        if (confirm(`Tem certeza que deseja eliminar o utilizador "${user.username}"?`)) {
            try {
                const response = await fetchWithAuth(`${API_URL}/users/${userId}`, {
                    method: 'DELETE'
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.message || 'Erro ao eliminar utilizador');
                }

                alert('Utilizador eliminado com sucesso!');
                loadUsers();
            } catch (error) {
                console.error('Erro ao eliminar utilizador:', error);
                alert('Erro ao eliminar utilizador: ' + error.message);
            }
        }
    }

    // Carrega utilizadores quando a página é carregada
    loadUsers();

    // Carrega os eventos quando a página é carregada
    loadEvents();
});
