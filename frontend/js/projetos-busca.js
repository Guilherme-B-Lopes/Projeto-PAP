// Sistema de busca e filtros para a página de projetos
// Verificar se API_URL já foi declarado (pode vir de auth.js)
// Se já existir no escopo global, usar; senão, declarar localmente
(function() {
    'use strict';
    
    // Declarar API_URL localmente dentro da IIFE para evitar conflitos
    // Como estamos em uma IIFE, não há conflito com API_URL de outros arquivos
    const API_URL = 'http://localhost:3000/api';
    
    let allProjects = []; // Todos os projetos carregados
    let filteredProjects = []; // Projetos filtrados

    // Elementos do DOM
    let modal, modalTitle, modalTurma, modalCategory, modalDescription, modalImage, closeBtn;
    let searchInput, filterButtons, projectGrid, resultsInfo;

    // Inicialização - múltiplas tentativas para garantir que funcione
    function init() {
    console.log('[projetos-busca] Iniciando...');
    console.log('[projetos-busca] Estado do documento:', document.readyState);
    
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            console.log('[projetos-busca] DOMContentLoaded disparado');
            initializeElements();
            setupEventListeners();
            loadProjects();
        });
    } else {
        console.log('[projetos-busca] DOM já carregado, inicializando imediatamente');
        // Pequeno delay para garantir que todos os scripts foram carregados
        setTimeout(() => {
            initializeElements();
            setupEventListeners();
            loadProjects();
        }, 100);
    }
}

    // A inicialização será chamada no final da IIFE

function initializeElements() {
    console.log('[projetos-busca] Inicializando elementos do DOM...');
    
    // Elementos do modal
    modal = document.getElementById('projectModal');
    modalTitle = document.getElementById('modalTitle');
    modalTurma = document.getElementById('modalTurma');
    modalCategory = document.getElementById('modalCategory');
    modalDescription = document.getElementById('modalDescription');
    modalImage = document.getElementById('modalImage');
    closeBtn = document.querySelector('#projectModal .close');
    
    // Elementos de busca
    searchInput = document.getElementById('searchInput');
    filterButtons = document.querySelectorAll('.filter-btn');
    projectGrid = document.getElementById('projectGrid');
    resultsInfo = document.getElementById('resultsInfo');
    
    // Verificações críticas
    console.log('[projetos-busca] projectGrid encontrado:', !!projectGrid);
    console.log('[projetos-busca] searchInput encontrado:', !!searchInput);
    console.log('[projetos-busca] resultsInfo encontrado:', !!resultsInfo);
    console.log('[projetos-busca] filterButtons encontrados:', filterButtons.length);
    
    if (!projectGrid) {
        console.error('[projetos-busca] ERRO CRÍTICO: projectGrid não encontrado!');
        console.error('[projetos-busca] Tentando encontrar alternativas...');
        const allGrids = document.querySelectorAll('[id*="grid"], [class*="grid"]');
        console.error('[projetos-busca] Elementos com "grid":', allGrids);
        
        // Tentar novamente após um delay
        setTimeout(() => {
            projectGrid = document.getElementById('projectGrid');
            if (projectGrid) {
                console.log('[projetos-busca] projectGrid encontrado na segunda tentativa!');
            } else {
                console.error('[projetos-busca] projectGrid ainda não encontrado após delay');
            }
        }, 500);
    } else {
        // Garantir que o grid está visível
        projectGrid.style.display = 'grid';
        projectGrid.style.visibility = 'visible';
        projectGrid.style.opacity = '1';
        console.log('[projetos-busca] Grid configurado para visível');
    }
}

function setupEventListeners() {
    // Busca em tempo real
    if (searchInput) {
        searchInput.addEventListener('input', handleSearch);
    }
    
    // Filtros por categoria
    filterButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            // Remover active de todos
            filterButtons.forEach(b => b.classList.remove('active'));
            // Adicionar active ao clicado
            btn.classList.add('active');
            handleFilter(btn.dataset.filter);
        });
    });
    
    // Modal
    if (closeBtn) {
        closeBtn.addEventListener('click', closeModal);
    }
    
    window.addEventListener('click', (event) => {
        if (event.target === modal) {
            closeModal();
        }
    });
    
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeModal();
        }
    });
}

// Carregar projetos do backend
async function loadProjects() {
    try {
        console.log('[projetos-busca] ========== INICIANDO CARREGAMENTO ==========');
        console.log('[projetos-busca] URL da API:', API_URL + '/projects');
        console.log('[projetos-busca] Timestamp:', new Date().toISOString());
        
        // Teste de conectividade básico
        console.log('[projetos-busca] Teste conectividade...');
        
        const response = await fetch(`${API_URL}/projects`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            cache: 'no-cache'
        });
        
        console.log('[projetos-busca] Resposta recebida. Status:', response.status, response.statusText);
        console.log('[projetos-busca] Headers:', Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
            const errorText = await response.text();
            console.error('[projetos-busca] Erro na resposta:', errorText);
            throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
        
        const data = await response.json();
        console.log('[projetos-busca] Dados brutos recebidos:', data);
        console.log('[projetos-busca] Tipo dos dados:', typeof data);
        console.log('[projetos-busca] É array?', Array.isArray(data));
        
        if (!Array.isArray(data)) {
            console.error('[projetos-busca] ERRO: Resposta não é um array!');
            console.error('[projetos-busca] Tipo:', typeof data);
            console.error('[projetos-busca] Valor:', data);
            throw new Error('Resposta da API não é um array');
        }
        
        allProjects = data;
        console.log('[projetos-busca] Projetos carregados com sucesso. Total:', allProjects.length);
        console.log('[projetos-busca] Dados dos projetos:', JSON.stringify(allProjects, null, 2));
        
        if (allProjects.length === 0) {
            console.warn('[projetos-busca] AVISO: Nenhum projeto retornado pela API!');
            if (projectGrid) {
                projectGrid.innerHTML = `
                    <div class="no-results" style="grid-column: 1 / -1; padding: 2rem; display: block;">
                        <h3>Nenhum projeto Criados</h3>
                        <p>Ainda não há projetos criados no sistema.</p>
                        <p><a href="cadastro.html" style="color: #2196F3;">Criar primeiro projeto</a></p>
                    </div>
                `;
            }
            if (resultsInfo) {
                resultsInfo.textContent = 'Nenhum projeto Criado';
            }
            return;
        }
        
        filteredProjects = [...allProjects];
        console.log('[projetos-busca] filteredProjects criado:', filteredProjects.length);
        
        // Garantir que o grid existe antes de renderizar
        if (!projectGrid) {
            projectGrid = document.getElementById('projectGrid');
        }
        
        renderProjects();
        updateResultsInfo();
        
        console.log('[projetos-busca] ========== CARREGAMENTO CONCLUÍDO ==========');
    } catch (error) {
        console.error('[projetos-busca] ========== ERRO NO CARREGAMENTO ==========');
        console.error('[projetos-busca] Erro:', error);
        console.error('[projetos-busca] Mensagem:', error.message);
        console.error('[projetos-busca] Stack trace:', error.stack);
        console.error('[projetos-busca] Tipo do erro:', error.constructor.name);
        
        // Tentar encontrar o grid novamente
        if (!projectGrid) {
            projectGrid = document.getElementById('projectGrid');
        }
        
        if (projectGrid) {
            projectGrid.innerHTML = `
                <div class="no-results" style="grid-column: 1 / -1; padding: 2rem; display: block; background: #fff3cd; border: 1px solid #ffc107; border-radius: 5px;">
                    <h3 style="color: #856404;">⚠️ Erro ao carregar projetos</h3>
                    <p><strong>Erro:</strong> ${error.message}</p>
                    <p><strong>URL:</strong> ${API_URL}/projects</p>
                    <p>Verifique se o servidor está rodando e acessível.</p>
                    <p style="margin-top: 1rem; font-size: 0.9rem; color: #666;">
                        <strong>Dicas:</strong><br>
                        • Verifique se o servidor backend está rodando na porta 3000<br>
                        • Abra o console do navegador (F12) para mais detalhes<br>
                        • Verifique se há erros de CORS no console
                    </p>
                </div>
            `;
        }
        if (resultsInfo) {
            resultsInfo.textContent = `Erro: ${error.message}`;
        }
    }
}

// Função de busca
function handleSearch() {
    const searchTerm = searchInput.value.toLowerCase().trim();
    applyFilters(searchTerm);
}

// Função de filtro por categoria
function handleFilter(category) {
    applyFilters(searchInput ? searchInput.value.toLowerCase().trim() : '', category);
}

// Aplicar filtros (busca + categoria)
function applyFilters(searchTerm = '', category = null) {
    // Se não há categoria selecionada, usar a do botão ativo
    if (!category) {
        const activeFilter = document.querySelector('.filter-btn.active');
        category = activeFilter ? activeFilter.dataset.filter : 'all';
    }
    
    filteredProjects = allProjects.filter(project => {
        // Filtro por categoria
        const categoryMatch = category === 'all' || project.category === category;
        
        // Filtro por busca
        const searchMatch = !searchTerm || 
            project.name.toLowerCase().includes(searchTerm) ||
            (project.turma && project.turma.toLowerCase().includes(searchTerm)) ||
            (project.description && project.description.toLowerCase().includes(searchTerm));
        
        return categoryMatch && searchMatch;
    });
    
    renderProjects();
    updateResultsInfo();
}

// Renderizar projetos no grid
function renderProjects() {
    console.log('[projetos-busca] ========== INICIANDO RENDERIZAÇÃO ==========');
    console.log('[projetos-busca] Total de projetos para renderizar:', filteredProjects.length);
    console.log('[projetos-busca] Projetos:', filteredProjects);
    
    // Tentar encontrar o grid novamente se não foi encontrado
    if (!projectGrid) {
        projectGrid = document.getElementById('projectGrid');
        console.log('[projetos-busca] Tentando encontrar grid novamente...', !!projectGrid);
    }
    
    if (!projectGrid) {
        console.error('[projetos-busca] ERRO CRÍTICO: Grid de projetos não encontrado!');
        console.error('[projetos-busca] DOM atual:', document.body.innerHTML.substring(0, 500));
        
        // Criar o grid se não existir
        const projectsSection = document.querySelector('.projects-section');
        if (projectsSection) {
            console.log('[projetos-busca] Criando grid dinamicamente...');
            projectGrid = document.createElement('div');
            projectGrid.id = 'projectGrid';
            projectGrid.className = 'project-grid';
            projectGrid.style.display = 'grid';
            projectGrid.style.visibility = 'visible';
            projectsSection.appendChild(projectGrid);
            console.log('[projetos-busca] Grid criado:', projectGrid);
        } else {
            console.error('[projetos-busca] Seção de projetos também não encontrada!');
            return;
        }
    }
    
    // Garantir que o grid está visível
    projectGrid.style.display = 'grid';
    projectGrid.style.visibility = 'visible';
    projectGrid.style.opacity = '1';
    projectGrid.style.minHeight = '200px';
    
    console.log('[projetos-busca] Grid encontrado:', projectGrid);
    console.log('[projetos-busca] Grid visível:', window.getComputedStyle(projectGrid).display);
    
    projectGrid.innerHTML = '';
    
    if (filteredProjects.length === 0) {
        console.warn('[projetos-busca] Nenhum projeto para renderizar após filtros');
        projectGrid.innerHTML = `
            <div class="no-results" style="grid-column: 1 / -1; padding: 2rem; display: block;">
                <h3>Nenhum projeto encontrado</h3>
                <p>Tente ajustar os filtros ou a busca</p>
            </div>
        `;
        return;
    }
    
    let renderedCount = 0;
    filteredProjects.forEach((project, index) => {
        try {
            console.log(`[projetos-busca] Renderizando projeto ${index + 1}/${filteredProjects.length}:`, project.name);
            
            const projectItem = document.createElement('div');
            projectItem.classList.add('project-item', project.category || '');
            projectItem.setAttribute('data-index', index);
            
            // Garantir que o item está visível
            projectItem.style.display = 'block';
            projectItem.style.visibility = 'visible';
            projectItem.style.opacity = '1';
            
            // Obter imagem
            let thumbSrc = '';
            if (Array.isArray(project.images) && project.images.length > 0) {
                thumbSrc = project.images[0];
            } else if (project.image) {
                thumbSrc = project.image;
            } else {
                thumbSrc = 'https://via.placeholder.com/300x200/cccccc/666666?text=Sem+Imagem';
            }
            
            projectItem.innerHTML = `
                <div class="project-thumb" style="display: block;">
                    <img src="${thumbSrc}" alt="${project.name || 'Projeto'}" style="display: block; width: 100%;" onerror="this.src='https://via.placeholder.com/300x200/cccccc/666666?text=Erro+na+Imagem'">
                    <span class="badge">${project.category || ''}</span>
                </div>
                <div class="project-info" style="display: block;">
                    <h3>${project.name || 'Sem nome'}</h3>
                    <p class="turma">Turma: ${project.turma || '-'}</p>
                </div>
            `;
            
            projectGrid.appendChild(projectItem);
            renderedCount++;
            
            // Event listener para abrir modal
            projectItem.addEventListener('click', () => {
                openModalByIndex(index);
            });
        } catch (error) {
            console.error(`[projetos-busca] Erro ao renderizar projeto ${index}:`, error);
            console.error('[projetos-busca] Stack:', error.stack);
        }
    });
    
    console.log(`[projetos-busca] ========== RENDERIZAÇÃO CONCLUÍDA ==========`);
    console.log(`[projetos-busca] ${renderedCount} projeto(s) renderizado(s) com sucesso`);
    console.log('[projetos-busca] Grid final:', projectGrid);
    console.log('[projetos-busca] Filhos do grid:', projectGrid.children.length);
    console.log('[projetos-busca] HTML do grid:', projectGrid.innerHTML.substring(0, 500));
    
    // Verificar se os elementos estão realmente no DOM
    const items = projectGrid.querySelectorAll('.project-item');
    console.log('[projetos-busca] Itens encontrados no DOM:', items.length);
    
    // Forçar reflow para garantir renderização
    void projectGrid.offsetHeight;
}

// Atualizar informação de resultados
function updateResultsInfo() {
    if (!resultsInfo) return;
    
    const total = allProjects.length;
    const showing = filteredProjects.length;
    
    if (showing === total) {
        resultsInfo.textContent = `Todos os ${total} projeto${total !== 1 ? 's' : ''}`;
    } else {
        resultsInfo.textContent = `${showing} de ${total} projeto${total !== 1 ? 's' : ''}`;
    }
}

// Abrir modal com detalhes do projeto
function openModalByIndex(index) {
    const project = filteredProjects[index];
    if (!project) return;
    
    if (!modal || !modalTitle || !modalTurma || !modalCategory || !modalDescription) {
        console.error('Elementos do modal não encontrados');
        return;
    }
    
    modalTitle.textContent = project.name;
    modalTurma.textContent = `Turma: ${project.turma || '-'}`;
    modalCategory.textContent = `Categoria: ${project.category ? project.category.charAt(0).toUpperCase() + project.category.slice(1) : '-'}`;
    modalDescription.textContent = project.description || 'Sem descrição';
    
    // Render galeria de imagens e vídeo dentro do modal
    const modalBody = document.querySelector('#projectModal .modal-body');
    if (modalBody) {
        // Limpar apenas a galeria e vídeo, mantendo os elementos de texto
        const existingGallery = modalBody.querySelector('.modal-gallery');
        const existingVideo = modalBody.querySelector('.modal-video');
        if (existingGallery) existingGallery.remove();
        if (existingVideo) existingVideo.remove();
        
        // Remover imagem antiga se existir
        const oldImage = modalBody.querySelector('#modalImage');
        if (oldImage && oldImage.parentNode === modalBody) {
            oldImage.remove();
        }
        
        // Galeria de imagens
        const images = Array.isArray(project.images) ? project.images : (project.image ? [project.image] : []);
        if (images.length) {
            const gallery = document.createElement('div');
            gallery.className = 'modal-gallery';
            images.forEach((src, idx) => {
                const img = document.createElement('img');
                img.src = src;
                img.alt = project.name + ' imagem ' + (idx + 1);
                img.style.width = '100%';
                img.style.maxHeight = '400px';
                img.style.objectFit = 'contain';
                img.style.marginBottom = '10px';
                gallery.appendChild(img);
            });
            modalBody.appendChild(gallery);
        }
        
        // Vídeo opcional
        if (project.videoUrl) {
            const videoWrapper = document.createElement('div');
            videoWrapper.className = 'modal-video';
            
            // Tentar detectar YouTube para embed
            const isYouTube = /youtube\.com|youtu\.be/.test(project.videoUrl);
            if (isYouTube) {
                let embedUrl = project.videoUrl;
                const match = project.videoUrl.match(/(?:v=|be\/)([A-Za-z0-9_-]{11})/);
                if (match && match[1]) {
                    embedUrl = 'https://www.youtube.com/embed/' + match[1];
                }
                const iframe = document.createElement('iframe');
                iframe.src = embedUrl;
                iframe.width = '100%';
                iframe.height = '360';
                iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
                iframe.allowFullscreen = true;
                videoWrapper.appendChild(iframe);
            } else {
                const video = document.createElement('video');
                video.controls = true;
                video.src = project.videoUrl;
                video.style.width = '100%';
                videoWrapper.appendChild(video);
            }
            modalBody.appendChild(videoWrapper);
        }
    }
    
    modal.style.display = 'block';
    document.body.style.overflow = 'hidden';
    
    setTimeout(() => {
        if (modal) modal.classList.add('show');
    }, 10);
}

    // Fechar modal
    function closeModal() {
        if (modal) {
            modal.classList.remove('show');
            setTimeout(() => {
                modal.style.display = 'none';
                document.body.style.overflow = '';
            }, 300);
        }
    }

    // Iniciar quando o script for carregado
    init();
})(); // Fim da IIFE
