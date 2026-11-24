// Local Storage Keys
const TASKS_STORAGE_KEY = 'app_tasks_v1';
const NOTES_STORAGE_KEY = 'app_notes_v1';

// Initial State
let tasks = [];
let notes = [];
let currentTaskFilter = 'all';
let activeTab = 'tasks-view';
let searchTerm = '';

// DOM Elements
const addTaskForm = document.getElementById('add-task-form');
const taskInput = document.getElementById('task-input');
const taskCategory = document.getElementById('task-category');
const taskPriority = document.getElementById('task-priority');
const tasksList = document.getElementById('tasks-list');
const noTasksMsg = document.getElementById('no-tasks-msg');

const addNoteForm = document.getElementById('add-note-form');
const noteTitle = document.getElementById('note-title');
const noteContent = document.getElementById('note-content');
const notesGrid = document.getElementById('notes-grid');
const noNotesMsg = document.getElementById('no-notes-msg');

const searchInput = document.getElementById('search-input');
const clearSearchBtn = document.getElementById('clear-search-btn');

const totalTasksCount = document.getElementById('total-tasks-count');
const completedTasksCount = document.getElementById('completed-tasks-count');
const pendingTasksCount = document.getElementById('pending-tasks-count');
const totalNotesCount = document.getElementById('total-notes-count');

const tabBtns = document.querySelectorAll('.tab-btn');
const viewContents = document.querySelectorAll('.view-content');
const filterBtns = document.querySelectorAll('.filter-btn');
const toastEl = document.getElementById('toast');
const toastMessageEl = document.getElementById('toast-message');

// Radio Color Pickers setup
const colorLabels = document.querySelectorAll('.color-circle');
colorLabels.forEach(label => {
    label.addEventListener('click', () => {
        colorLabels.forEach(l => l.classList.remove('active'));
        label.classList.add('active');
        const radio = label.querySelector('input[type="radio"]');
        if (radio) radio.checked = true;
    });
});

// Initialize App
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    setupEventListeners();
    renderAll();
});

// Load Data from LocalStorage (or populate defaults)
function loadData() {
    const storedTasks = localStorage.getItem(TASKS_STORAGE_KEY);
    const storedNotes = localStorage.getItem(NOTES_STORAGE_KEY);

    if (storedTasks) {
        try { tasks = JSON.parse(storedTasks); } catch (e) { tasks = []; }
    } else {
        // Default sample tasks
        tasks = [
            {
                id: '1',
                text: 'إنشاء تطبيق إدارة المهام والملاحظات',
                category: 'عمل',
                priority: 'عالية',
                completed: true,
                createdAt: new Date().toISOString()
            },
            {
                id: '2',
                text: 'مراجعة الدروس اليومية وقراءة كتاب جديد',
                category: 'دراسة',
                priority: 'متوسطة',
                completed: false,
                createdAt: new Date().toISOString()
            }
        ];
        saveTasks();
    }

    if (storedNotes) {
        try { notes = JSON.parse(storedNotes); } catch (e) { notes = []; }
    } else {
        // Default sample note
        notes = [
            {
                id: '1',
                title: 'نصيحة إنتاجية 💡',
                content: 'قم بتقسيم المهام الكبيرة إلى مهام صغيرة وقابلة للتنفيذ يومياً للحصول على أفضل نتائج.',
                color: 'purple',
                createdAt: new Date().toISOString()
            }
        ];
        saveNotes();
    }
}

// Save Functions
function saveTasks() {
    localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
}

function saveNotes() {
    localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
}

// Toast Helper
let toastTimeout;
function showToast(message) {
    toastMessageEl.textContent = message;
    toastEl.classList.remove('hidden');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
        toastEl.classList.add('hidden');
    }, 2500);
}

// Format Date Helper
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-EG', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Setup Event Listeners
function setupEventListeners() {
    // Add Task Form Submission
    addTaskForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = taskInput.value.trim();
        if (!text) return;

        const newTask = {
            id: Date.now().toString(),
            text: text,
            category: taskCategory.value,
            priority: taskPriority.value,
            due: (document.getElementById('task-due') || {}).value || '',
            completed: false,
            createdAt: new Date().toISOString()
        };

        tasks.unshift(newTask);
        saveTasks();
        renderAll();
        taskInput.value = '';
        const dueEl = document.getElementById('task-due'); if (dueEl) dueEl.value = '';
        showToast('تمت إضافة المهمة بنجاح! ✨');
    });

    // Add Note Form Submission
    addNoteForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = noteTitle.value.trim();
        const content = noteContent.value.trim();
        if (!title || !content) return;

        const selectedColorRadio = document.querySelector('input[name="note-color"]:checked');
        const color = selectedColorRadio ? selectedColorRadio.value : 'blue';

        const newNote = {
            id: Date.now().toString(),
            title: title,
            content: content,
            color: color,
            createdAt: new Date().toISOString()
        };

        notes.unshift(newNote);
        saveNotes();
        renderAll();
        noteTitle.value = '';
        noteContent.value = '';
        showToast('تمت إضافة الملاحظة بنجاح! 📝');
    });

    // View Switching Tabs
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const targetTab = btn.getAttribute('data-tab');
            activeTab = targetTab;

            viewContents.forEach(content => {
                if (content.id === targetTab) {
                    content.classList.remove('hidden-view');
                    content.classList.add('active-view');
                } else {
                    content.classList.add('hidden-view');
                    content.classList.remove('active-view');
                }
            });
        });
    });

    // Task Filter Buttons
    filterBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            filterBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTaskFilter = btn.getAttribute('data-filter');
            renderTasks();
        });
    });

    // Search Input
    searchInput.addEventListener('input', (e) => {
        searchTerm = e.target.value.trim().toLowerCase();
        if (searchTerm) {
            clearSearchBtn.classList.remove('hidden');
        } else {
            clearSearchBtn.classList.add('hidden');
        }
        renderTasks();
        renderNotes();
    });

    // Clear Search Button
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchTerm = '';
        clearSearchBtn.classList.add('hidden');
        renderTasks();
        renderNotes();
    });
}

// Render Everything
function renderAll() {
    renderTasks();
    renderNotes();
    updateStats();
}

// Update Dashboard Counters
function updateStats() {
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(t => t.completed).length;
    const pendingTasks = totalTasks - completedTasks;
    const totalNotes = notes.length;

    totalTasksCount.textContent = totalTasks;
    completedTasksCount.textContent = completedTasks;
    pendingTasksCount.textContent = pendingTasks;
    totalNotesCount.textContent = totalNotes;
}

// Render Tasks
function renderTasks() {
    tasksList.innerHTML = '';

    const filteredTasks = tasks.filter(task => {
        // Filter by tab status
        if (currentTaskFilter === 'pending' && task.completed) return false;
        if (currentTaskFilter === 'completed' && !task.completed) return false;

        // Filter by search query
        if (searchTerm) {
            const matchText = task.text.toLowerCase().includes(searchTerm);
            const matchCategory = task.category.toLowerCase().includes(searchTerm);
            return matchText || matchCategory;
        }

        return true;
    });

    if (filteredTasks.length === 0) {
        noTasksMsg.classList.remove('hidden');
    } else {
        noTasksMsg.classList.add('hidden');
    }

    filteredTasks.forEach(task => {
        const li = document.createElement('li');
        li.className = `task-item ${task.completed ? 'completed' : ''}`;

        const today = new Date().toISOString().slice(0, 10);
        const overdue = task.due && !task.completed && task.due < today;
        const dueBadge = task.due ? `<span class="badge ${overdue ? 'badge-overdue' : 'badge-due'}"><i class="fa-regular fa-calendar"></i> ${overdue ? 'متأخرة: ' : ''}${escapeHtml(task.due)}</span>` : '';
        li.innerHTML = `
            <div class="task-left">
                <div class="task-checkbox" role="checkbox" tabindex="0" aria-checked="${task.completed}" aria-label="تحديد المهمة كمكتملة" onclick="toggleTask('${task.id}')" onkeydown="if(event.key===' '||event.key==='Enter'){event.preventDefault();toggleTask('${task.id}')}">
                    ${task.completed ? '<i class="fa-solid fa-check"></i>' : ''}
                </div>
                <div class="task-content-wrapper">
                    <span class="task-text">${escapeHtml(task.text)}</span>
                    <div class="task-meta">
                        <span class="badge badge-category">${escapeHtml(task.category)}</span>
                        <span class="badge priority-${escapeHtml(task.priority)}">أولوية: ${escapeHtml(task.priority)}</span>
                        ${dueBadge}
                        <span><i class="fa-regular fa-clock"></i> ${formatDate(task.createdAt)}</span>
                    </div>
                </div>
            </div>
            <div class="task-actions">
                <button class="icon-btn" onclick="editTask('${task.id}')" title="تعديل المهمة" aria-label="تعديل المهمة">
                    <i class="fa-solid fa-pen"></i>
                </button>
                <button class="icon-btn delete-btn" onclick="deleteTask('${task.id}')" title="حذف المهمة" aria-label="حذف المهمة">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        `;

        tasksList.appendChild(li);
    });
}

// Toggle Task Complete
window.toggleTask = function(id) {
    tasks = tasks.map(t => {
        if (t.id === id) {
            const updated = !t.completed;
            showToast(updated ? 'أحسنت! تم إكمال المهمة 🎉' : 'تم تحويل المهمة إلى قيد الانتظار');
            return { ...t, completed: updated };
        }
        return t;
    });
    saveTasks();
    renderAll();
};

// Delete Task
window.deleteTask = function(id) {
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderAll();
    showToast('تم حذف المهمة بنجاح');
};

// Render Notes
function renderNotes() {
    notesGrid.innerHTML = '';

    const filteredNotes = notes.filter(note => {
        if (!searchTerm) return true;
        const matchTitle = note.title.toLowerCase().includes(searchTerm);
        const matchContent = note.content.toLowerCase().includes(searchTerm);
        return matchTitle || matchContent;
    });

    if (filteredNotes.length === 0) {
        noNotesMsg.classList.remove('hidden');
    } else {
        noNotesMsg.classList.add('hidden');
    }

    filteredNotes.forEach(note => {
        const card = document.createElement('div');
        card.className = `note-card note-${note.color || 'blue'}`;

        card.innerHTML = `
            <div>
                <h3 class="note-title">${escapeHtml(note.title)}</h3>
                <p class="note-content">${escapeHtml(note.content)}</p>
            </div>
            <div class="note-footer">
                <span class="note-date"><i class="fa-regular fa-calendar"></i> ${formatDate(note.createdAt)}</span>
                <button class="icon-btn delete-btn" onclick="deleteNote('${note.id}')" title="حذف الملاحظة">
                    <i class="fa-solid fa-trash-can"></i>
                </button>
            </div>
        `;

        notesGrid.appendChild(card);
    });
}

// Delete Note
window.deleteNote = function(id) {
    notes = notes.filter(n => n.id !== id);
    saveNotes();
    renderAll();
    showToast('تم حذف الملاحظة بنجاح');
};

// Utility to escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}


// Edit task (inline: replace the text with an input; Enter saves, Escape cancels)
window.editTask = function(id) {
    const t = tasks.find(x => x.id === id); if (!t) return;
    const items = [...tasksList.querySelectorAll('.task-item')];
    const idx = tasks.filter(task => {
        if (currentTaskFilter === 'pending' && task.completed) return false;
        if (currentTaskFilter === 'completed' && !task.completed) return false;
        if (searchTerm) return task.text.toLowerCase().includes(searchTerm) || task.category.toLowerCase().includes(searchTerm);
        return true;
    }).findIndex(x => x.id === id);
    const span = items[idx] && items[idx].querySelector('.task-text'); if (!span) return;
    const input = document.createElement('input'); input.type = 'text'; input.value = t.text; input.className = 'edit-input'; input.setAttribute('aria-label', 'نص المهمة');
    span.replaceWith(input); input.focus(); input.select();
    const done = (save) => { const v = input.value.trim(); if (save && v) { t.text = v; saveTasks(); showToast('تم تعديل المهمة'); } renderAll(); };
    input.addEventListener('keydown', e => { if (e.key === 'Enter') done(true); else if (e.key === 'Escape') done(false); });
    input.addEventListener('blur', () => done(true));
};

// Clear completed / export / import
document.addEventListener('DOMContentLoaded', () => {
    const clearBtn = document.getElementById('clear-done-btn'), exp = document.getElementById('export-btn'), imp = document.getElementById('import-file');
    if (clearBtn) clearBtn.addEventListener('click', () => {
        const n = tasks.filter(t => t.completed).length;
        if (!n) return showToast('لا توجد مهام مكتملة');
        if (!confirm('حذف ' + n + ' مهمة مكتملة؟')) return;
        tasks = tasks.filter(t => !t.completed); saveTasks(); renderAll(); showToast('تم مسح المهام المكتملة');
    });
    if (exp) exp.addEventListener('click', () => {
        const blob = new Blob([JSON.stringify({ tasks, notes }, null, 2)], { type: 'application/json' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'tasks-notes-backup.json'; a.click(); URL.revokeObjectURL(a.href);
        showToast('تم تصدير نسخة احتياطية');
    });
    if (imp) imp.addEventListener('change', () => {
        const f = imp.files[0]; if (!f) return;
        const r = new FileReader();
        r.onload = () => {
            try {
                const d = JSON.parse(r.result);
                const ok = o => o && typeof o.id === 'string' && typeof (o.text || o.title) === 'string';
                if (!Array.isArray(d.tasks) || !Array.isArray(d.notes) || !d.tasks.every(ok) || !d.notes.every(ok)) throw new Error('shape');
                tasks = d.tasks; notes = d.notes; saveTasks(); saveNotes(); renderAll(); showToast('تم استيراد البيانات');
            } catch (e) { showToast('ملف غير صالح، لم يتم تغيير أي بيانات'); }
            imp.value = '';
        };
        r.readAsText(f);
    });
});
