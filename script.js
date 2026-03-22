// Settings
let totalCycles = 4;
let workDuration = 25; // in minutes
let restDuration = 5; // in minutes

// State
let timeLeft = workDuration * 60; // in seconds
let isRunning = false;
let currentCycle = 0;
let isRestMode = false;
let timerInterval;
let totalSessionTime = workDuration * 60; // Total time for current session

const timerDisplay = document.getElementById('timer');
const modeDisplay = document.getElementById('mode');
const startBtn = document.getElementById('start');
const resetBtn = document.getElementById('reset');
const cyclesInput = document.getElementById('cycles');
const workTimeInput = document.getElementById('workTime');
const restTimeInput = document.getElementById('restTime');
const progressFill = document.getElementById('progress-fill');
const sessionCounter = document.getElementById('session-counter');

function updateDisplay() {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    modeDisplay.textContent = isRestMode ? 'Rest' : 'Study';
    modeDisplay.style.color = isRestMode ? '#EEE82C' : '#53A548';
    sessionCounter.textContent = `Session ${currentCycle + 1}/${totalCycles}`;
    
    // Update progress bar
    const elapsed = totalSessionTime - timeLeft;
    const progressPercentage = (elapsed / totalSessionTime) * 100;
    progressFill.style.width = progressPercentage + '%';
    
    // Update circles fill
    updateCirclesFill(progressPercentage);
}

function updateCirclesFill(progressPercentage) {
    const circleFills = document.querySelectorAll('.circle-fill');
    
    // Update fill height for all circles
    circleFills.forEach((fill, index) => {
        if (index < currentCycle) {
            // Previous cycles - fully filled
            fill.style.height = '100%';
        } else if (index === currentCycle) {
            // Current cycle - fill based on rest mode
            if (isRestMode) {
                fill.style.height = progressPercentage + '%';
            } else {
                fill.style.height = '0%';
            }
        } else {
            // Future cycles - empty
            fill.style.height = '0%';
        }
    });
}

function startTimer() {
    if (isRunning) return;
    
    isRunning = true;
    startBtn.textContent = 'Pause';
    cyclesInput.disabled = true;
    workTimeInput.disabled = true;
    restTimeInput.disabled = true;
    
    timerInterval = setInterval(() => {
        timeLeft--;
        updateDisplay();
        
        if (timeLeft === 0) {
            clearInterval(timerInterval);
            isRunning = false;
            startBtn.textContent = 'Start';
            
            if (isRestMode) {
                // End of rest, move to next cycle
                if (currentCycle < totalCycles - 1) {
                    currentCycle++;
                    isRestMode = false;
                    timeLeft = workDuration * 60;
                    totalSessionTime = timeLeft;
                    alert('Rest over! Back to work!');
                } else {
                    // All cycles complete
                    alert('All cycles complete!');
                    resetTimer();
                    return;
                }
            } else {
                // End of work, move to rest
                isRestMode = true;
                timeLeft = restDuration * 60;
                totalSessionTime = timeLeft;
                alert('Work session complete! Time to rest.');
            }
            updateDisplay();
        }
    }, 1000);
}

function pauseTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    startBtn.textContent = 'Start';
}

function resetTimer() {
    clearInterval(timerInterval);
    isRunning = false;
    startBtn.textContent = 'Start';
    currentCycle = 0;
    isRestMode = false;
    totalCycles = parseInt(cyclesInput.value);
    workDuration = parseInt(workTimeInput.value);
    restDuration = parseInt(restTimeInput.value);
    timeLeft = workDuration * 60;
    totalSessionTime = timeLeft;
    cyclesInput.disabled = false;
    workTimeInput.disabled = false;
    restTimeInput.disabled = false;
    updateDisplay();
    progressFill.style.width = '0%';
}

startBtn.addEventListener('click', () => {
    if (isRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
});

resetBtn.addEventListener('click', resetTimer);

cyclesInput.addEventListener('change', () => {
    if (!isRunning) {
        resetTimer();
    }
});

workTimeInput.addEventListener('change', () => {
    if (!isRunning) {
        resetTimer();
    }
});

restTimeInput.addEventListener('change', () => {
    if (!isRunning) {
        resetTimer();
    }
});

// Initialize display
updateDisplay();
