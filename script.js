document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("welcomeScreen").style.display = "flex";
    document.getElementById("appContainer").style.display = "none";
    loadTasks();
    enableDragAndDrop();
    if (Notification.permission === "default") {
        Notification.requestPermission();
    }
    setInterval(updateAllCountdowns, 1000); 
});




const alertSound = new Audio("asas.mp3"); 


// Dark Mode Toggle
function toggleDarkMode() {
    document.body.classList.toggle("dark-mode");
    localStorage.setItem("darkMode", document.body.classList.contains("dark-mode"));
}

// Load Dark Mode Preference
document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("darkMode") === "true") {
        document.body.classList.add("dark-mode");
    }
});




function startApp() {
    document.getElementById("welcomeScreen").style.display = "none";
    document.getElementById("appContainer").style.display = "block";
}



function format12HourTime(timeString) {
    if (!timeString) return "";
    let [hours, minutes] = timeString.split(":");
    let amPm = hours >= 12 ? "PM" : "AM";
    hours = (hours % 12) || 12;
    return `${hours}:${minutes} ${amPm}`;
}

function calculateTimeRemaining(dueDate, dueTime) {
    if (!dueDate) return "No deadline";
    
    let deadline = new Date(dueDate + (dueTime ? `T${dueTime}` : "T23:59:59"));
    let now = new Date();
    let diff = deadline - now;

    if (diff <= 0) return "0h 0m 0s";  // Instead of "Deadline passed"

    let hours = Math.floor(diff / (1000 * 60 * 60));
    let minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return `${hours}h ${minutes}m ${seconds}s`;
}


function notifyDeadline(taskName) {
    if (Notification.permission === "granted") {
        new Notification("Task Deadline Reached", {
            body: `The task '${taskName}' has reached its deadline!`,
            icon: "notification_icon.png"
        });
    }

    alertSound.play();
    alarmPlaying = true;

    let stopButton = document.getElementById("stopAlarm");
    if (stopButton) stopButton.style.display = "block"; // Show the button when alarm starts
}

function stopAlarm() {
    alertSound.pause();
    alertSound.currentTime = 0;  
    alarmPlaying = false;

    let stopButton = document.getElementById("stopAlarm");
    if (stopButton) stopButton.style.display = "none"; // Hide the button when alarm stops
}

// Ensure the stop button is hidden on page load
document.addEventListener("DOMContentLoaded", () => {
    let stopButton = document.getElementById("stopAlarm");
    if (stopButton) stopButton.style.display = "none";
});

// Attach event listener to stop button
document.getElementById("stopAlarm").addEventListener("click", stopAlarm);

function updateCountdown(li, dueDate, dueTime) {
    let countdownElement = li.querySelector(".countdown-timer");
    let taskName = li.querySelector(".task-text").textContent;

    function update() {
        let timeRemaining = calculateTimeRemaining(dueDate, dueTime);
        countdownElement.textContent = timeRemaining;

        if (timeRemaining === "0h 0m 0s") {  // Only trigger alarm at the exact deadline
            notifyDeadline(taskName);
            clearInterval(interval);
        }
    }

    update();
    let interval = setInterval(update, 1000);
}


function addTask() {
    let taskInput = document.getElementById("taskInput").value.trim();
    let dueDate = document.getElementById("dueDate").value;
    let dueTimeInput = document.getElementById("dueTime"); 
    let dueTime = dueTimeInput ? dueTimeInput.value : "";
    let category = document.getElementById("category").value;

    if (taskInput === "") {
        alert("Please enter a task!");
        return;
    }

    let taskList = document.getElementById("taskList");
    if (!taskList) {
        console.error("Error: Task list element not found!");
        return;
    }

    let li = document.createElement("li");
    li.className = "list-group-item d-flex flex-column draggable";
    li.draggable = true;
    li.innerHTML = `
        <div><strong>Task:</strong> <span class="task-text">${taskInput}</span></div>
        <div><strong>Category:</strong> <span class="task-category">${category}</span></div>
        <div><strong>Deadline:</strong> <em class="task-deadline" data-time="${dueTime}">${dueDate || "No date"}</em> ${dueTime ? `at ${format12HourTime(dueTime)}` : ""}</div>
        <div><strong>Time Remaining:</strong> <span class="countdown-timer"></span></div>
        <div class="d-flex justify-content-end">
            <button class="btn btn-warning btn-sm me-2 edit-task">
                <i class="fas fa-edit"></i>
            </button>
            <button class="btn btn-danger btn-sm delete-task">
                <i class="fas fa-trash-alt"></i>
            </button>
        </div>
    `;

    taskList.appendChild(li);
    updateCountdown(li, dueDate, dueTime);  
    enableDragAndDrop();  
    saveTasks();  

    document.getElementById("taskInput").value = "";
    document.getElementById("dueDate").value = "";
    if (dueTimeInput) dueTimeInput.value = "";
}

function editTask(event) {
    let li = event.target.closest("li");
    let taskText = li.querySelector(".task-text").textContent;
    let categoryText = li.querySelector(".task-category").textContent;
    let deadlineText = li.querySelector(".task-deadline").textContent;

    let newTask = prompt("Edit task:", taskText);
    let newCategory = prompt("Edit category:", categoryText);
    let newDeadline = prompt("Edit due date:", deadlineText);

    if (newTask) li.querySelector(".task-text").textContent = newTask;
    if (newCategory) li.querySelector(".task-category").textContent = newCategory;
    if (newDeadline) li.querySelector(".task-deadline").textContent = newDeadline;

    saveTasks();
}

function removeTask(event) {
    event.target.closest("li").remove();
    saveTasks();
}

document.addEventListener("click", function(event) {
    if (event.target.closest(".edit-task")) editTask(event);
    if (event.target.closest(".delete-task")) removeTask(event);
});

function saveTasks() {
    let tasks = [];
    document.querySelectorAll("#taskList li").forEach(li => {
        let task = li.querySelector(".task-text").textContent;
        let category = li.querySelector(".task-category").textContent;
        let dueDate = li.querySelector(".task-deadline").textContent;
        let dueTime = li.querySelector(".task-deadline").dataset.time;
        tasks.push({ task, category, dueDate, dueTime });
    });
    localStorage.setItem("tasks", JSON.stringify(tasks));
}



function loadTasks() {
    let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
    let taskList = document.getElementById("taskList");

    taskList.innerHTML = ""; // Clear existing tasks
    tasks.forEach(({ task, category, dueDate, dueTime }) => {
        let li = document.createElement("li");
        li.className = "list-group-item d-flex flex-column draggable";
        li.draggable = true;
        li.innerHTML = `
            <div><strong>Task:</strong> <span class="task-text">${task}</span></div>
            <div><strong>Category:</strong> <span class="task-category">${category}</span></div>
            <div><strong>Deadline:</strong> <em class="task-deadline" data-time="${dueTime}">${dueDate || "No date"}</em> ${dueTime ? `at ${format12HourTime(dueTime)}` : ""}</div>
            <div><strong>Time Remaining:</strong> <span class="countdown-timer"></span></div>
            <div class="d-flex justify-content-end">
                <button class="btn btn-warning btn-sm me-2 edit-task">
                    <i class="fas fa-edit"></i>
                </button>
                <button class="btn btn-danger btn-sm delete-task">
                
                    <i class="fas fa-trash-alt"></i>
                </button>
            </div>
        `;
        taskList.appendChild(li);
        updateCountdown(li, dueDate, dueTime);
    });
}
function enableDragAndDrop() {
    const taskList = document.getElementById("taskList");
    const items = taskList.querySelectorAll(".draggable");

    items.forEach((item, index) => {
        item.dataset.index = index; // Assign index for ordering
        
        item.addEventListener("dragstart", (e) => {
            e.dataTransfer.setData("text/plain", item.dataset.index);
            item.classList.add("dragging");
        });

        item.addEventListener("dragend", () => {
            item.classList.remove("dragging");
        });
    });

    taskList.addEventListener("dragover", (e) => {
        e.preventDefault();
        const draggedItem = document.querySelector(".dragging");
        const afterElement = getDragAfterElement(taskList, e.clientY);

        if (afterElement) {
            taskList.insertBefore(draggedItem, afterElement);
        } else {
            taskList.appendChild(draggedItem); // Move to the end if no position found
        }
    });

    taskList.addEventListener("drop", () => {
        saveTasks(); // Save new order after drop
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll(".draggable:not(.dragging)")];

    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        return offset < 0 && offset > closest.offset
            ? { offset, element: child }
            : closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}







function updateClock() {
    let now = new Date();
    let hours = now.getHours();
    let minutes = now.getMinutes().toString().padStart(2, '0');
    let seconds = now.getSeconds().toString().padStart(2, '0');
    let amPm = hours >= 12 ? 'PM' : 'AM';
    hours = (hours % 12) || 12;
    let timeString = `${hours}:${minutes}:${seconds} ${amPm}`;
    document.getElementById("clock").textContent = timeString;
}

setInterval(updateClock, 1000);
updateClock();






// Initialize local storage and retrieve tasks
const tasks = JSON.parse(localStorage.getItem('tasks')) || [];

// Function to add a task
taskForm.addEventListener('submit', function (e) {
    e.preventDefault();
    const taskText = document.getElementById('taskText').value;
    const taskDate = document.getElementById('taskDate').value;
    
    if (taskText && taskDate) {
        tasks.push({ text: taskText, date: taskDate, completed: false });
        localStorage.setItem('tasks', JSON.stringify(tasks));
        renderCalendar();
    }
});

// Function to render the calendar
function renderCalendar() {
    const calendar = document.getElementById('calendar');
    calendar.innerHTML = '';
    const today = new Date().toISOString().split('T')[0];
    
    tasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.innerText = task.text;
        taskElement.classList.add('task');
        
        if (task.date < today) {
            taskElement.style.color = 'red'; // Overdue tasks
        } else if (task.date === today) {
            taskElement.style.color = 'orange'; // Today's tasks
        }
        
        document.querySelector(`[data-date='${task.date}']`)?.appendChild(taskElement);
    });
}

// Function to load calendar days
document.addEventListener('DOMContentLoaded', function () {
    generateCalendar();
    renderCalendar();
});

// Function to filter tasks
function filterTasks(filterType) {
    const today = new Date().toISOString().split('T')[0];
    let filteredTasks = [];
    
    if (filterType === 'today') {
        filteredTasks = tasks.filter(task => task.date === today);
    } else if (filterType === 'month') {
        const currentMonth = today.slice(0, 7);
        filteredTasks = tasks.filter(task => task.date.startsWith(currentMonth));
    } else if (filterType === 'upcoming') {
        filteredTasks = tasks.filter(task => task.date >= today);
    }
    
    renderFilteredTasks(filteredTasks);
}

// Function to display filtered tasks
function renderFilteredTasks(filteredTasks) {
    const taskList = document.getElementById('taskList');
    taskList.innerHTML = '';
    
    filteredTasks.forEach(task => {
        const taskElement = document.createElement('div');
        taskElement.innerText = `${task.text} (Due: ${task.date})`;
        
        if (task.date < new Date().toISOString().split('T')[0]) {
            taskElement.style.color = 'red';
        }
        
        taskList.appendChild(taskElement);
    });
}
