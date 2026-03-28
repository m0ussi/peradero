// Timer data storage
const defaultTimers = [
    { id: 0, name: 'Classic', workTime: 25, restTime: 5, reps: 4 },
    { id: 1, name: 'Long Break', workTime: 50, restTime: 15, reps: 4 },
    { id: 2, name: 'Quick', workTime: 15, restTime: 5, reps: 4 }
];

let timers = [];
let currentTimerId = 0;
let isRunning = false;
let isPaused = false;
let remainingSeconds = 25 * 60;
let currentCycle = 1;
let isWorkPhase = true;
let timerInterval = null;

const STORAGE_KEY = 'perodoro_timers';

// DOM Elements
const addTimerBtn = document.querySelector('.add-timer-btn');
const modal = document.getElementById('modal');
const closeBtn = document.querySelector('.close');
const createBtn = document.getElementById('create-btn');
const startBtn = document.getElementById('start-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const deleteTimerBtn = document.getElementById('delete-timer-btn');
const editTimerBtn = document.getElementById('edit-timer-btn');
const editModal = document.getElementById('edit-modal');
const closeEditBtn = document.querySelector('.close-edit');
const saveEditBtn = document.getElementById('save-edit-btn');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    loadTimers();
    renderTimerButtons();
    updateDisplay();
    
    addTimerBtn.addEventListener('click', openModal);
    closeBtn.addEventListener('click', closeModal);
    createBtn.addEventListener('click', createTimer);
    startBtn.addEventListener('click', startTimer);
    pauseBtn.addEventListener('click', pauseTimer);
    resetBtn.addEventListener('click', resetTimer);
    deleteTimerBtn.addEventListener('click', deleteCurrentTimer);
    editTimerBtn.addEventListener('click', openEditModal);
    closeEditBtn.addEventListener('click', closeEditModal);
    saveEditBtn.addEventListener('click', saveEditTimer);
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) closeEditModal();
    });
});

// Load timers from localStorage
function loadTimers() {
    const saved = localStorage.getItem(STORAGE_KEY);
    
    if (saved) {
        try {
            timers = JSON.parse(saved);
        } catch (e) {
            console.error('Failed to load timers:', e);
            timers = [...defaultTimers];
        }
    } else {
        timers = [...defaultTimers];
        saveTimers();
    }
    
    // Set current timer to first timer
    if (timers.length > 0) {
        currentTimerId = timers[0].id;
        const timer = timers.find(t => t.id === currentTimerId);
        if (timer) {
            remainingSeconds = timer.workTime * 60;
        }
    }
}
function saveTimers() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(timers));
}

// Render timer buttons in sidebar
function renderTimerButtons() {
    const timersList = document.querySelector('.timers-list');
    
    // Clear existing buttons except the heading
    const existingWrappers = timersList.querySelectorAll('.timer-btn-wrapper');
    existingWrappers.forEach(wrapper => wrapper.remove());
    
    // Add new buttons
    timers.forEach(timer => {
        const wrapper = document.createElement('div');
        wrapper.className = 'timer-btn-wrapper';
        
        const btn = document.createElement('button');
        btn.className = `timer-btn ${timer.id === currentTimerId ? 'active' : ''} ${timer.id > 2 ? 'custom' : ''}`;
        btn.dataset.timerId = timer.id;
        btn.innerHTML = `
            <span class="timer-name">${timer.name}</span>
            <span class="timer-config">${timer.workTime}m / ${timer.restTime}m</span>
        `;
        btn.addEventListener('click', selectTimer);
        
        wrapper.appendChild(btn);
        timersList.appendChild(wrapper);
    });
}

// Select timer
function selectTimer(e) {
    const btn = e.currentTarget;
    const timerId = parseInt(btn.dataset.timerId);
    
    // Remove active class from all buttons
    document.querySelectorAll('.timer-btn').forEach(b => b.classList.remove('active'));
    
    // Add active class to clicked button
    btn.classList.add('active');
    
    // Switch to selected timer
    currentTimerId = timerId;
    currentCycle = 1;
    isWorkPhase = true;
    isRunning = false;
    isPaused = false;
    
    const timer = timers.find(t => t.id === currentTimerId);
    remainingSeconds = timer.workTime * 60;
    
    updateDisplay();
    updateDeleteButton();
    resetButtonStates();
}

// Delete timer
function deleteTimer(timerId) {
    // Prevent deletion if it's the last timer or if it's the only one selected
    const customTimers = timers.filter(t => t.id > 2);
    if (timerId <= 2) {
        alert('Cannot delete default timers');
        return;
    }
    
    if (confirm('Delete this timer?')) {
        timers = timers.filter(t => t.id !== timerId);
        saveTimers();
        
        // If deleted timer was active, switch to another one
        if (currentTimerId === timerId) {
            currentTimerId = timers[0].id;
            currentCycle = 1;
            isWorkPhase = true;
            remainingSeconds = timers[0].workTime * 60;
        }
        
        renderTimerButtons();
        updateDisplay();
        updateDeleteButton();
        resetButtonStates();
    }
}

// Delete current timer from main display
function deleteCurrentTimer() {
    deleteTimer(currentTimerId);
}

// Update delete button visibility
function updateDeleteButton() {
    if (currentTimerId > 2) {
        deleteTimerBtn.style.display = 'block';
        editTimerBtn.style.display = 'block';
    } else {
        deleteTimerBtn.style.display = 'none';
        editTimerBtn.style.display = 'none';
    }
}

// Update display
function updateDisplay() {
    const timer = timers.find(t => t.id === currentTimerId);
    if (!timer) return;
    
    document.getElementById('timer-title').textContent = timer.name;
    document.getElementById('work-time').textContent = `${timer.workTime}m`;
    document.getElementById('rest-time').textContent = timer.restTime === 0 ? 'X' : `${timer.restTime}m`;
    document.getElementById('repetitions').textContent = timer.reps;
    document.getElementById('current-cycle').textContent = currentCycle;
    document.getElementById('total-cycles').textContent = timer.reps;
    
    // Update timer display
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = remainingSeconds % 60;
    document.getElementById('timer-value').textContent = 
        `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    
    document.getElementById('timer-phase').textContent = isWorkPhase ? 'Work' : 'Rest';
}

// Start timer
function startTimer() {
    if (isRunning) return;
    
    isRunning = true;
    isPaused = false;
    startBtn.disabled = true;
    pauseBtn.disabled = false;
    
    timerInterval = setInterval(() => {
        remainingSeconds--;
        
        if (remainingSeconds < 0) {
            switchPhase();
        }
        
        updateDisplay();
    }, 1000);
}

// Pause timer
function pauseTimer() {
    isRunning = false;
    isPaused = true;
    clearInterval(timerInterval);
    startBtn.disabled = false;
    pauseBtn.disabled = true;
}

// Reset timer
function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    isPaused = false;
    
    const timer = timers.find(t => t.id === currentTimerId);
    if (!timer) return;
    
    currentCycle = 1;
    isWorkPhase = true;
    remainingSeconds = timer.workTime * 60;
    
    resetButtonStates();
    updateDisplay();
}

// Switch between work and rest phases
function switchPhase() {
    const timer = timers.find(t => t.id === currentTimerId);
    if (!timer) return;
    
    if (isWorkPhase) {
        // Work phase ended
        playSound();
        pauseTimer();
        alert('Work time ended! Time for rest. 💪');
        
        // If rest time is 0, skip rest and go to next cycle
        if (timer.restTime === 0) {
            if (currentCycle < timer.reps) {
                currentCycle++;
                isWorkPhase = true;
                remainingSeconds = timer.workTime * 60;
            } else {
                // Timer completed
                completeTimer();
                return;
            }
        } else {
            // Switch to rest phase
            isWorkPhase = false;
            remainingSeconds = timer.restTime * 60;
        }
    } else {
        // Rest phase ended
        playSound();
        pauseTimer();
        alert('Rest time ended! Ready for the next round? 🍐');
        
        // Switch to work phase
        if (currentCycle < timer.reps) {
            currentCycle++;
            isWorkPhase = true;
            remainingSeconds = timer.workTime * 60;
        } else {
            // Timer completed
            completeTimer();
            return;
        }
    }
    
    updateDisplay();
}

// Complete timer
function completeTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    resetButtonStates();
    
    // Play completion sound
    playSound();
    
    // Show completion alert
    alert('Timer completed! Great work! 🎉');
    
    // Reset for next use
    const timer = timers.find(t => t.id === currentTimerId);
    if (timer) {
        currentCycle = 1;
        isWorkPhase = true;
        remainingSeconds = timer.workTime * 60;
        updateDisplay();
    }
}

// Play notification sound
function playSound() {
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
}

// Reset button states
function resetButtonStates() {
    startBtn.disabled = false;
    pauseBtn.disabled = true;
}

// Modal functions
function openModal() {
    modal.classList.add('show');
}

function closeModal() {
    modal.classList.remove('show');
    clearModalInputs();
}

function clearModalInputs() {
    document.getElementById('timer-name-input').value = '';
    document.getElementById('work-time-input').value = '25';
    document.getElementById('rest-time-input').value = '5';
    document.getElementById('reps-input').value = '4';
}

// Create new timer
function createTimer() {
    const name = document.getElementById('timer-name-input').value.trim();
    const workTime = parseInt(document.getElementById('work-time-input').value);
    const restTime = parseInt(document.getElementById('rest-time-input').value);
    const reps = parseInt(document.getElementById('reps-input').value);
    
    if (!name) {
        alert('Please enter a timer name');
        return;
    }
    
    if (workTime < 1 || restTime < 0 || reps < 1) {
        alert('Please enter valid values');
        return;
    }
    
    const newTimer = {
        id: Math.max(...timers.map(t => t.id), 2) + 1,
        name,
        workTime,
        restTime,
        reps
    };
    
    timers.push(newTimer);
    saveTimers();
    renderTimerButtons();
    closeModal();
    
    // Select the newly created timer
    const newBtn = document.querySelector(`[data-timer-id="${newTimer.id}"]`);
    if (newBtn) {
        newBtn.click();
    }
}

// Open edit modal
function openEditModal() {
    const timer = timers.find(t => t.id === currentTimerId);
    if (!timer) return;
    
    document.getElementById('edit-timer-name-input').value = timer.name;
    document.getElementById('edit-work-time-input').value = timer.workTime;
    document.getElementById('edit-rest-time-input').value = timer.restTime;
    document.getElementById('edit-reps-input').value = timer.reps;
    
    editModal.classList.add('show');
}

// Close edit modal
function closeEditModal() {
    editModal.classList.remove('show');
}

// Save edited timer
function saveEditTimer() {
    const name = document.getElementById('edit-timer-name-input').value.trim();
    const workTime = parseInt(document.getElementById('edit-work-time-input').value);
    const restTime = parseInt(document.getElementById('edit-rest-time-input').value);
    const reps = parseInt(document.getElementById('edit-reps-input').value);
    
    if (!name) {
        alert('Please enter a timer name');
        return;
    }
    
    if (workTime < 1 || restTime < 0 || reps < 1) {
        alert('Please enter valid values');
        return;
    }
    
    // Update the timer
    const timer = timers.find(t => t.id === currentTimerId);
    if (timer) {
        timer.name = name;
        timer.workTime = workTime;
        timer.restTime = restTime;
        timer.reps = reps;
        
        // Reset timer to new work time
        currentCycle = 1;
        isWorkPhase = true;
        remainingSeconds = timer.workTime * 60;
        
        saveTimers();
        renderTimerButtons();
        updateDisplay();
        closeEditModal();
        resetButtonStates();
    }
}
