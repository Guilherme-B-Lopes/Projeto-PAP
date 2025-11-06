// calendario.js
document.addEventListener('DOMContentLoaded', () => {
    const API_URL = 'http://localhost:3000/api';

    const currentMonthYearSpan = document.getElementById('currentMonthYear');
    const calendarGrid = document.getElementById('calendarGrid');
    const prevMonthBtn = document.getElementById('prevMonth');
    const nextMonthBtn = document.getElementById('nextMonth');

    const eventDisplayModal = document.getElementById('eventDisplayModal');
    const closeEventModalBtn = eventDisplayModal.querySelector('.close-event-modal');
    const eventModalDate = document.getElementById('eventModalDate');
    const eventListForDay = document.getElementById('eventListForDay');

    let currentMonth = new Date().getMonth();
    let currentYear = new Date().getFullYear();
    let events = []; // Array para armazenar os eventos do backend

    const monthNames = [
        "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
        "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    const dayNames = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

    // Função para carregar eventos do backend
    async function fetchEvents() {
        try {
            const response = await fetch(`${API_URL}/events`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            events = await response.json();
            renderCalendar(); // Renderiza o calendário após buscar os eventos
        } catch (error) {
            console.error('Erro ao carregar eventos:', error);
            // Opcional: Mostrar mensagem de erro no calendário
        }
    }

    // Função para renderizar o calendário
    function renderCalendar() {
        calendarGrid.innerHTML = ''; // Limpa o grid

        // Adiciona os nomes dos dias da semana
        dayNames.forEach(day => {
            const dayNameDiv = document.createElement('div');
            dayNameDiv.classList.add('day-name');
            dayNameDiv.textContent = day;
            calendarGrid.appendChild(dayNameDiv);
        });

        currentMonthYearSpan.textContent = `${monthNames[currentMonth]} ${currentYear}`;

        const firstDayOfMonth = new Date(currentYear, currentMonth, 1);
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const firstDayOfWeek = firstDayOfMonth.getDay(); // 0 for Sunday, 1 for Monday, etc.

        const today = new Date();
        const todayDate = today.getDate();
        const todayMonth = today.getMonth();
        const todayYear = today.getFullYear();

        // Preenche os dias vazios antes do primeiro dia do mês
        for (let i = 0; i < firstDayOfWeek; i++) {
            const emptyDay = document.createElement('div');
            emptyDay.classList.add('day', 'inactive');
            calendarGrid.appendChild(emptyDay);
        }

        // Preenche os dias do mês
        for (let day = 1; day <= daysInMonth; day++) {
            const dayDiv = document.createElement('div');
            dayDiv.classList.add('day');
            dayDiv.innerHTML = `<span class="date-number">${day}</span>`;

            // Marca o dia atual
            if (day === todayDate && currentMonth === todayMonth && currentYear === todayYear) {
                dayDiv.classList.add('current-day');
            }

            // Verifica se há eventos para este dia
            const dateString = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const eventsForDay = events.filter(event => event.date === dateString);

            if (eventsForDay.length > 0) {
                const eventIndicator = document.createElement('span');
                eventIndicator.classList.add('event-indicator');
                eventIndicator.textContent = eventsForDay.length === 1 ? eventsForDay[0].title : `${eventsForDay.length} eventos`;
                if (eventsForDay.length > 1) {
                    eventIndicator.classList.add('multiple');
                }
                dayDiv.appendChild(eventIndicator);
                dayDiv.classList.add('has-event'); // Adiciona classe para estilização se houver evento

                // Adiciona listener para abrir modal de eventos
                dayDiv.addEventListener('click', () => openEventDisplayModal(dateString, eventsForDay));
            } else {
                dayDiv.addEventListener('click', () => openEventDisplayModal(dateString, []));
            }

            calendarGrid.appendChild(dayDiv);
        }
    }

    // Função para abrir o modal de exibição de eventos
    function openEventDisplayModal(dateString, eventsForDay) {
        eventModalDate.textContent = `Eventos para: ${formatDateToDisplay(dateString)}`;
        eventListForDay.innerHTML = '';

        if (eventsForDay.length === 0) {
            eventListForDay.innerHTML = '<p>Nenhum evento agendado para este dia.</p>';
        } else {
            eventsForDay.sort((a, b) => a.time.localeCompare(b.time)); // Ordena por hora
            eventsForDay.forEach(event => {
                const eventItem = document.createElement('div');
                eventItem.classList.add('event-list-item');
                eventItem.innerHTML = `
                    <span>${event.time} - ${event.title}</span>
                `;
                eventListForDay.appendChild(eventItem);
            });
        }
        eventDisplayModal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }

    // Função auxiliar para formatar data para exibição
    function formatDateToDisplay(dateString) {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
    }

    // Event Listeners para navegação do calendário
    prevMonthBtn.addEventListener('click', () => {
        currentMonth--;
        if (currentMonth < 0) {
            currentMonth = 11;
            currentYear--;
        }
        fetchEvents(); // Recarrega eventos para o novo mês
    });

    nextMonthBtn.addEventListener('click', () => {
        currentMonth++;
        if (currentMonth > 11) {
            currentMonth = 0;
            currentYear++;
        }
        fetchEvents(); // Recarrega eventos para o novo mês
    });

    // Event Listeners para fechar o modal de eventos
    closeEventModalBtn.addEventListener('click', () => {
        eventDisplayModal.style.display = 'none';
        document.body.style.overflow = '';
    });
    window.addEventListener('click', (event) => {
        if (event.target === eventDisplayModal) {
            eventDisplayModal.style.display = 'none';
            document.body.style.overflow = '';
        }
    });
    window.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            eventDisplayModal.style.display = 'none';
            document.body.style.overflow = '';
        }
    });

    // Renderiza o calendário na carga da página
    fetchEvents(); // Carrega os eventos do backend
    
    // Demo: animação da square seguindo o rato dentro do demo
    const demosRoot = document.querySelector('#docs-demos');
    const demo = document.querySelector('.docs-demo.is-active');
    const square = document.querySelector('.docs-demo .square');
    if (demosRoot && demo && square) {
        let bounds = demo.getBoundingClientRect();
        const refreshBounds = () => { bounds = demo.getBoundingClientRect(); };

        // animação suave para x/y com 500ms
        let animX = null, animY = null;
        let currentX = 0, currentY = 0;

        function animateTo(prop, to) {
            const from = prop === 'x' ? currentX : currentY;
            const start = performance.now();
            const duration = 500;
            const easeOutCubic = t => 1 - Math.pow(1 - t, 3); // aprox out(3)

            function frame(now) {
                const t = Math.min(1, (now - start) / duration);
                const eased = easeOutCubic(t);
                const value = from + (to - from) * eased;
                if (prop === 'x') currentX = value; else currentY = value;
                square.style.transform = `translate(calc(-50% + ${currentX}px), calc(-50% + ${currentY}px))`;
                if (t < 1) {
                    (prop === 'x' ? animX = requestAnimationFrame(frame) : animY = requestAnimationFrame(frame));
                }
            }
            (prop === 'x' ? animX && cancelAnimationFrame(animX) : animY && cancelAnimationFrame(animY));
            (prop === 'x' ? animX = requestAnimationFrame(frame) : animY = requestAnimationFrame(frame));
        }

        function clamp(n, min, max) { return Math.max(min, Math.min(max, n)); }

        function onMouseMove(e) {
            const { width, height, left, top } = bounds;
            const hw = width / 2;
            const hh = height / 2;
            const x = clamp(e.clientX - left - hw, -hw, hw);
            const y = clamp(e.clientY - top - hh, -hh, hh);
            animateTo('x', x);
            animateTo('y', y);
        }

        window.addEventListener('mousemove', onMouseMove);
        demosRoot.addEventListener('scroll', refreshBounds);
        window.addEventListener('resize', refreshBounds);
    }
});
