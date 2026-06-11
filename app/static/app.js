// state.js (State management)
const state = {
    activeTab: 'upload',
    questions: [],
    currentQuestionIndex: 0,
    sessionId: null,
    answers: {}, // Key: question_id, Value: "A", "B", "C"
    timerInterval: null,
    secondsElapsed: 0,
    uploadedFile: null,
    history: []
};

// DOM Elements
const dropZone = document.getElementById('drop-zone');
const fileInput = document.getElementById('file-input');
const fileInfo = document.getElementById('file-info');
const loadedFileName = document.getElementById('loaded-file-name');
const loadedFileSize = document.getElementById('loaded-file-size');
const btnStartEvaluation = document.getElementById('btn-start-evaluation');
const lblStatusFile = document.getElementById('lbl-status-file');

const tabQuiz = document.getElementById('tab-quiz');
const tabResults = document.getElementById('tab-results');
const btnSideQuiz = document.getElementById('btn-side-quiz');

const timerVal = document.getElementById('timer-val');
const questionIndicator = document.getElementById('question-indicator');
const progressBarFill = document.getElementById('progress-bar-fill');
const progressPercentageLabel = document.getElementById('progress-percentage-label');

const lblQuestionNum = document.getElementById('lbl-question-num');
const lblQuestionText = document.getElementById('lbl-question-text');
const quizOptionsWrapper = document.getElementById('quiz-options-wrapper');
const btnPrevQuestion = document.getElementById('btn-prev-question');
const btnNextQuestion = document.getElementById('btn-next-question');
const navigationDots = document.getElementById('navigation-dots');

const modalConfirm = document.getElementById('modal-confirm');
const confirmModalMsg = document.getElementById('confirm-modal-msg');

// Initial Setup
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide icons
    lucide.createIcons();
    
    // Drag & Drop event listeners
    setupDragAndDrop();
    
    // Load history on start
    fetchHistory();
});

// Drag and Drop Logic
function setupDragAndDrop() {
    dropZone.addEventListener('click', () => fileInput.click());
    
    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            handleSelectedFile(e.target.files[0]);
        }
    });

    dropZone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropZone.classList.add('dragover');
    });

    dropZone.addEventListener('dragleave', () => {
        dropZone.classList.remove('dragover');
    });

    dropZone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropZone.classList.remove('dragover');
        if (e.dataTransfer.files.length > 0) {
            handleSelectedFile(e.dataTransfer.files[0]);
        }
    });
}

function handleSelectedFile(file) {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
        alert('Por favor, selecciona un archivo Excel válido (.xlsx o .xls)');
        return;
    }
    
    state.uploadedFile = file;
    loadedFileName.innerText = file.name;
    loadedFileSize.innerText = `${(file.size / 1024).toFixed(1)} KB`;
    
    dropZone.style.display = 'none';
    fileInfo.style.display = 'flex';
    lblStatusFile.innerText = file.name;
    
    // Setup upload trigger
    btnStartEvaluation.onclick = uploadExcelFile;
}

// Upload excel to backend
async function uploadExcelFile() {
    if (!state.uploadedFile) return;
    
    const formData = new FormData();
    formData.append('file', state.uploadedFile);
    
    btnStartEvaluation.disabled = true;
    btnStartEvaluation.innerHTML = '<i data-lucide="loader-2" class="animate-spin"></i> Cargando...';
    lucide.createIcons();
    
    try {
        const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
        });
        
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || 'Error al procesar el archivo Excel.');
        }
        
        const data = await response.json();
        
        // Setup quiz session
        state.questions = data.questions;
        state.sessionId = data.session_id;
        state.currentQuestionIndex = 0;
        state.answers = {};
        
        // Document badge and update sidebar
        document.getElementById('file-loaded-badge').innerText = state.questions.length;
        
        // Enable side quiz button
        btnSideQuiz.classList.remove('disabled');
        tabQuiz.style.display = 'flex';
        
        // Reset and start timer
        startQuizTimer();
        
        // Go to Quiz tab
        switchTab('quiz');
        renderQuestion();
        
    } catch (error) {
        alert(error.message);
    } finally {
        btnStartEvaluation.disabled = false;
        btnStartEvaluation.innerHTML = '<i data-lucide="play"></i> Ejecutar Cuestionario';
        lucide.createIcons();
    }
}

// Quiz timer
function startQuizTimer() {
    clearInterval(state.timerInterval);
    state.secondsElapsed = 0;
    timerVal.innerText = '00:00';
    
    state.timerInterval = setInterval(() => {
        state.secondsElapsed++;
        const minutes = Math.floor(state.secondsElapsed / 60).toString().padStart(2, '0');
        const seconds = (state.secondsElapsed % 60).toString().padStart(2, '0');
        timerVal.innerText = `${minutes}:${seconds}`;
    }, 1000);
}

// Tab switcher logic
function switchTab(tabName) {
    state.activeTab = tabName;
    
    // Update active state in tabs bar
    document.querySelectorAll('.editor-tab').forEach(el => el.classList.remove('active'));
    const targetTab = document.getElementById(`tab-${tabName}`);
    if (targetTab) targetTab.classList.add('active');
    
    // Update active state in vertical sidebar buttons
    document.querySelectorAll('.activity-btn').forEach(el => el.classList.remove('active'));
    const targetBtn = document.getElementById(`btn-side-${tabName}`);
    if (targetBtn) targetBtn.classList.add('active');
    
    // Show correct section
    document.querySelectorAll('.panel-section').forEach(el => el.classList.remove('active'));
    const targetPanel = document.getElementById(`panel-${tabName}`);
    if (targetPanel) targetPanel.classList.add('active');
    
    // Refresh history if going to history tab
    if (tabName === 'history') {
        fetchHistory();
    }
}

// Render Question Logic
function renderQuestion() {
    const question = state.questions[state.currentQuestionIndex];
    if (!question) return;
    
    // Labels
    lblQuestionNum.innerText = question.id;
    lblQuestionText.innerText = question.pregunta;
    
    // Update progress bar
    const progressPercent = Math.round(((state.currentQuestionIndex + 1) / state.questions.length) * 100);
    progressBarFill.style.width = `${progressPercent}%`;
    questionIndicator.innerText = `Pregunta ${state.currentQuestionIndex + 1} de ${state.questions.length}`;
    progressPercentageLabel.innerText = `${progressPercent}% completado`;
    
    // Render options
    quizOptionsWrapper.innerHTML = '';
    const options = [
        { key: 'A', value: question.opcion_a },
        { key: 'B', value: question.opcion_b },
        { key: 'C', value: question.opcion_c }
    ];
    
    options.forEach(opt => {
        const optionRow = document.createElement('div');
        optionRow.className = 'option-row';
        if (state.answers[question.id] === opt.key) {
            optionRow.classList.add('selected');
        }
        
        optionRow.innerHTML = `
            <span class="option-letter">${opt.key}</span>
            <span class="option-text">${escapeHTML(opt.value)}</span>
        `;
        
        optionRow.onclick = () => selectOption(question.id, opt.key);
        quizOptionsWrapper.appendChild(optionRow);
    });
    
    // Navigation buttons state
    btnPrevQuestion.disabled = (state.currentQuestionIndex === 0);
    
    if (state.currentQuestionIndex === state.questions.length - 1) {
        btnNextQuestion.innerHTML = 'Calificar (F5) <i data-lucide="check-square"></i>';
        btnNextQuestion.onclick = confirmFinishEvaluation;
    } else {
        btnNextQuestion.innerHTML = 'Siguiente <i data-lucide="chevron-right"></i>';
        btnNextQuestion.onclick = () => navigateQuestion(1);
    }
    
    // Render bottom navigation dots
    renderNavigationDots();
    lucide.createIcons();
}

function selectOption(questionId, letter) {
    state.answers[questionId] = letter;
    
    // Re-render options to update styles
    document.querySelectorAll('.option-row').forEach(row => {
        row.classList.remove('selected');
        if (row.querySelector('.option-letter').innerText === letter) {
            row.classList.add('selected');
        }
    });
    
    // Update dots indicator
    renderNavigationDots();
}

function renderNavigationDots() {
    navigationDots.innerHTML = '';
    state.questions.forEach((q, idx) => {
        const dot = document.createElement('span');
        dot.className = 'nav-dot';
        if (idx === state.currentQuestionIndex) dot.classList.add('active');
        if (state.answers[q.id]) dot.classList.add('answered');
        
        dot.onclick = () => {
            state.currentQuestionIndex = idx;
            renderQuestion();
        };
        navigationDots.appendChild(dot);
    });
}

function navigateQuestion(direction) {
    state.currentQuestionIndex += direction;
    
    // Keep inside boundaries
    if (state.currentQuestionIndex < 0) state.currentQuestionIndex = 0;
    if (state.currentQuestionIndex >= state.questions.length) {
        state.currentQuestionIndex = state.questions.length - 1;
    }
    
    renderQuestion();
}

// Close tabs
function closeQuizTab(e) {
    e.stopPropagation();
    if (confirm('¿Deseas cerrar la evaluación activa? Se perderá el progreso.')) {
        clearInterval(state.timerInterval);
        state.sessionId = null;
        state.questions = [];
        tabQuiz.style.display = 'none';
        btnSideQuiz.classList.add('disabled');
        document.getElementById('file-loaded-badge').innerText = '';
        switchTab('upload');
    }
}

function closeResultsTab(e) {
    e.stopPropagation();
    tabResults.style.display = 'none';
    if (state.sessionId) {
        switchTab('quiz');
    } else {
        switchTab('upload');
    }
}

// Confirm Evaluation Completion
function confirmFinishEvaluation() {
    const totalQuestions = state.questions.length;
    const answeredCount = Object.keys(state.answers).length;
    
    if (answeredCount < totalQuestions) {
        confirmModalMsg.innerText = `Tienes ${totalQuestions - answeredCount} pregunta(s) sin responder de un total de ${totalQuestions}. ¿Deseas calificar la evaluación de todas formas?`;
    } else {
        confirmModalMsg.innerText = `Has respondido las ${totalQuestions} preguntas. ¿Deseas calificar la evaluación ahora?`;
    }
    
    modalConfirm.style.display = 'flex';
    lucide.createIcons();
}

function closeConfirmModal() {
    modalConfirm.style.display = 'none';
}

// Submit Quiz to API
async function submitQuiz() {
    closeConfirmModal();
    clearInterval(state.timerInterval);
    
    // Prepare answers list for submission API
    const submissionAnswers = state.questions.map(q => ({
        question_id: q.id,
        respuesta: state.answers[q.id] || null
    }));
    
    const payload = {
        session_id: state.sessionId,
        respuestas: submissionAnswers
    };
    
    try {
        const response = await fetch('/api/evaluate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });
        
        if (!response.ok) {
            const errData = await response.json();
            throw new Error(errData.detail || 'Error al calificar el cuestionario.');
        }
        
        const result = await response.json();
        
        // Render Results Tab
        renderEvaluationResults(result);
        
        // Show results tab
        tabResults.style.display = 'flex';
        switchTab('results');
        
        // Remove active evaluation since it's finished
        tabQuiz.style.display = 'none';
        btnSideQuiz.classList.add('disabled');
        state.sessionId = null;
        document.getElementById('file-loaded-badge').innerText = '';
        
    } catch (error) {
        alert(error.message);
        // Resume timer if failed
        startQuizTimer();
    }
}

// Render Results layout
let globalResultsData = null; // Store locally for filtering

function renderEvaluationResults(result) {
    globalResultsData = result;
    
    // Stats
    document.getElementById('lbl-res-correctas').innerText = result.correctas;
    document.getElementById('lbl-res-incorrectas').innerText = result.incorrectas;
    document.getElementById('lbl-res-totales').innerText = result.total;
    
    // Percent label
    document.getElementById('lbl-res-percent').innerText = `${result.porcentaje_aprobacion}%`;
    
    // Circle SVG animation
    const circleVal = document.getElementById('results-circle-val');
    const radius = 40;
    const circumference = 2 * Math.PI * radius; // 251.2
    const offset = circumference - (result.porcentaje_aprobacion / 100) * circumference;
    
    // Set colors according to approval status
    const statusBadge = document.getElementById('lbl-res-status-badge');
    if (result.aprobado) {
        statusBadge.className = 'status-result-badge approved';
        statusBadge.innerText = 'APROBADO (≥ 75%)';
        circleVal.style.stroke = 'var(--accent-green)';
    } else {
        statusBadge.className = 'status-result-badge failed';
        statusBadge.innerText = 'REPROBADO (< 75%)';
        circleVal.style.stroke = 'var(--accent-red)';
    }
    
    circleVal.style.strokeDasharray = circumference;
    // Timeout to trigger smooth CSS animation
    setTimeout(() => {
        circleVal.style.strokeDashoffset = offset;
    }, 100);
    
    // Render Results Grid Table
    renderResultsTable('all');
}

function renderResultsTable(filter) {
    const tbody = document.getElementById('results-table-body');
    tbody.innerHTML = '';
    
    if (!globalResultsData || !globalResultsData.detalles) return;
    
    globalResultsData.detalles.forEach(detail => {
        const isCorrect = detail.es_correcta;
        
        // Filter elements
        if (filter === 'correct' && !isCorrect) return;
        if (filter === 'incorrect' && isCorrect) return;
        
        const tr = document.createElement('tr');
        
        // Style user answer cell based on correctness
        let userAnsClass = '';
        if (detail.respuesta_usuario) {
            userAnsClass = isCorrect ? 'correct-highlight' : 'incorrect-highlight';
        }
        
        tr.innerHTML = `
            <td style="font-family: 'Fira Code', monospace; color: var(--text-muted);">${detail.id}</td>
            <td><strong>${escapeHTML(detail.pregunta)}</strong><br>
                <span style="font-size: 11px; color: var(--text-muted);">
                    A: ${escapeHTML(detail.opcion_a)} | B: ${escapeHTML(detail.opcion_b)} | C: ${escapeHTML(detail.opcion_c)}
                </span>
            </td>
            <td class="${userAnsClass}">
                Opción ${detail.respuesta_usuario || 'Sin Responder'}
            </td>
            <td class="correct-highlight">
                Opción ${detail.respuesta_correcta}
            </td>
            <td>
                <span class="badge-cell ${isCorrect ? 'correct' : 'incorrect'}">
                    ${isCorrect ? 'Correcto' : 'Incorrecto'}
                </span>
            </td>
        `;
        
        tbody.appendChild(tr);
    });
}

function filterResults(filterType) {
    // Update filter active button styles
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    
    // Find clicked button and highlight
    const event = window.event;
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    renderResultsTable(filterType);
}

// Fetch Quiz History from backend
async function fetchHistory() {
    try {
        const response = await fetch('/api/history');
        if (!response.ok) throw new Error('Error al cargar historial.');
        
        const data = await response.json();
        state.history = data;
        
        renderHistoryList();
    } catch (error) {
        console.error('Error fetching history:', error);
    }
}

function renderHistoryList() {
    const wrapper = document.getElementById('history-items-wrapper');
    wrapper.innerHTML = '';
    
    if (state.history.length === 0) {
        wrapper.innerHTML = `
            <div class="no-history-msg">
                <i data-lucide="info"></i>
                <span>No hay evaluaciones en el historial local. Realiza una evaluación para verla aquí.</span>
            </div>
        `;
        lucide.createIcons();
        return;
    }
    
    state.history.forEach((run, idx) => {
        const card = document.createElement('div');
        card.className = `history-card ${run.aprobado ? 'approved' : 'failed'}`;
        
        card.innerHTML = `
            <div class="history-card-info">
                <h4>Ejecución #${state.history.length - idx} - ${run.aprobado ? 'Aprobado' : 'Reprobado'}</h4>
                <p><i data-lucide="calendar" style="width: 10px; height: 10px; display: inline;"></i> ${run.fecha} | Total Preguntas: ${run.total}</p>
            </div>
            <div class="history-card-score">
                <span class="history-score-val ${run.aprobado ? 'text-green' : 'text-red'}">${run.porcentaje_aprobacion}%</span>
                <span style="font-size: 11px; color: var(--text-muted);">${run.correctas} de ${run.total} correctas</span>
            </div>
        `;
        
        // Make card clickable to inspect results again
        card.style.cursor = 'pointer';
        card.onclick = () => {
            renderEvaluationResults(run);
            tabResults.style.display = 'flex';
            switchTab('results');
        };
        
        wrapper.appendChild(card);
    });
    lucide.createIcons();
}

// Retry same quiz
function restartSameQuiz() {
    if (!state.uploadedFile) {
        alert('Carga el archivo Excel de nuevo para iniciar.');
        switchTab('upload');
        return;
    }
    uploadExcelFile();
}

// Utilities
function escapeHTML(str) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}
