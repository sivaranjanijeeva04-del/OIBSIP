
/* =========================
   TaskFlow - To-Do App
   ========================= */

const taskForm = document.getElementById("taskForm");
const taskInput = document.getElementById("taskInput");
const submitBtn = document.getElementById("submitBtn");
const taskList = document.getElementById("taskList");
const emptyState = document.getElementById("emptyState");
const formMessage = document.getElementById("formMessage");

const totalCount = document.getElementById("totalCount");
const pendingCount = document.getElementById("pendingCount");
const completedCount = document.getElementById("completedCount");
const taskCountLabel = document.getElementById("taskCountLabel");

const clearCompletedBtn = document.getElementById("clearCompletedBtn");
const currentDate = document.getElementById("currentDate");
const filterButtons = document.querySelectorAll(".filter-btn");

let tasks = [];
let currentFilter = "all";
let editingTaskId = null;

// Create a unique ID for each task.
function createTaskId() {
    if (window.crypto && typeof window.crypto.randomUUID === "function") {
        return window.crypto.randomUUID();
    }

    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// Load saved tasks safely.
function loadTasks() {
    try {
        const savedTasks = localStorage.getItem("taskflow-tasks");

        if (!savedTasks) {
            return [];
        }

        const parsedTasks = JSON.parse(savedTasks);

        if (!Array.isArray(parsedTasks)) {
            return [];
        }

        return parsedTasks.filter((task) =>
            task &&
            typeof task.id === "string" &&
            typeof task.text === "string" &&
            typeof task.completed === "boolean"
        );
    } catch (error) {
        console.error("Could not load saved tasks:", error);
        return [];
    }
}

// Save tasks in browser localStorage.
function saveTasks() {
    try {
        localStorage.setItem("taskflow-tasks", JSON.stringify(tasks));
        return true;
    } catch (error) {
        console.error("Could not save tasks:", error);
        showMessage("Unable to save tasks in this browser.");
        return false;
    }
}

// Display a short message.
function showMessage(message = "") {
    formMessage.textContent = message;
}

// Reset the form after adding or editing.
function resetForm() {
    editingTaskId = null;
    taskForm.reset();
    submitBtn.textContent = "+ Add Task";
}

// Add a new task.
function addTask(text) {
    const newTask = {
        id: createTaskId(),
        text: text,
        completed: false,
        createdAt: new Date().toISOString()
    };

    tasks.unshift(newTask);
    saveTasks();
    renderTasks();
}

// Start editing an existing task.
function editTask(taskId) {
    const task = tasks.find((item) => item.id === taskId);

    if (!task) {
        return;
    }

    editingTaskId = taskId;
    taskInput.value = task.text;
    submitBtn.textContent = "Save Changes";
    showMessage("");

    taskInput.focus();
    taskForm.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });
}

// Delete a task.
function deleteTask(taskId) {
    const task = tasks.find((item) => item.id === taskId);

    if (!task) {
        return;
    }

    const confirmed = window.confirm(
        `Delete this task?\n\n${task.text}`
    );

    if (!confirmed) {
        return;
    }

    tasks = tasks.filter((item) => item.id !== taskId);

    if (editingTaskId === taskId) {
        resetForm();
    }

    saveTasks();
    renderTasks();
    showMessage("Task deleted.");
}

// Mark a task as complete or pending.
function toggleTask(taskId) {
    tasks = tasks.map((task) => {
        if (task.id === taskId) {
            return {
                ...task,
                completed: !task.completed
            };
        }

        return task;
    });

    saveTasks();
    renderTasks();
}

// Create a button safely.
function createActionButton(label, className, action, taskId) {
    const button = document.createElement("button");

    button.type = "button";
    button.className = className;
    button.textContent = label;
    button.dataset.action = action;
    button.dataset.id = taskId;
    button.setAttribute("aria-label", `${action} task`);

    return button;
}

// Render all visible tasks.
function renderTasks() {
    taskList.replaceChildren();

    const visibleTasks = tasks.filter((task) => {
        if (currentFilter === "pending") {
            return !task.completed;
        }

        if (currentFilter === "completed") {
            return task.completed;
        }

        return true;
    });

    visibleTasks.forEach((task) => {
        const item = document.createElement("li");
        item.className = "task-item";

        if (task.completed) {
            item.classList.add("completed");
        }

        const checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.className = "task-checkbox";
        checkbox.checked = task.completed;
        checkbox.dataset.action = "toggle";
        checkbox.dataset.id = task.id;
        checkbox.setAttribute("aria-label", `Complete ${task.text}`);

        const text = document.createElement("span");
        text.className = "task-text";
        text.textContent = task.text;

        const actions = document.createElement("div");
        actions.className = "task-actions";

        const editButton = createActionButton(
            "Edit",
            "action-btn",
            "edit",
            task.id
        );

        const deleteButton = createActionButton(
            "Delete",
            "action-btn delete",
            "delete",
            task.id
        );

        actions.append(editButton, deleteButton);
        item.append(checkbox, text, actions);
        taskList.appendChild(item);
    });

    // Update the empty state.
    emptyState.classList.toggle("hidden", visibleTasks.length > 0);

    if (visibleTasks.length === 0) {
        const emptyHeading = emptyState.querySelector("h3");
        const emptyParagraph = emptyState.querySelector("p");

        if (currentFilter === "completed") {
            emptyHeading.textContent = "No completed tasks";
            emptyParagraph.textContent = "Completed tasks will appear here.";
        } else if (currentFilter === "pending") {
            emptyHeading.textContent = "No pending tasks";
            emptyParagraph.textContent = "You're all caught up!";
        } else {
            emptyHeading.textContent = "No tasks yet";
            emptyParagraph.textContent =
                "Add your first task and make today productive.";
        }
    }

    // Update task summary.
    const completed = tasks.filter((task) => task.completed).length;
    const pending = tasks.length - completed;

    totalCount.textContent = tasks.length;
    pendingCount.textContent = pending;
    completedCount.textContent = completed;

    taskCountLabel.textContent =
        `${visibleTasks.length} ${visibleTasks.length === 1 ? "task" : "tasks"}`;

    clearCompletedBtn.disabled = completed === 0;
    clearCompletedBtn.style.opacity = completed === 0 ? "0.5" : "1";
}

// Handle add and edit form submissions.
taskForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const text = taskInput.value.trim();

    if (!text) {
        showMessage("Please enter a task.");
        taskInput.focus();
        return;
    }

    if (editingTaskId !== null) {
        const taskExists = tasks.some(
            (task) => task.id === editingTaskId
        );

        if (!taskExists) {
            resetForm();
            showMessage("Task not found. Please try again.");
            return;
        }

        tasks = tasks.map((task) => {
            if (task.id === editingTaskId) {
                return {
                    ...task,
                    text: text
                };
            }

            return task;
        });

        saveTasks();
        resetForm();
        renderTasks();
        showMessage("Task updated successfully.");
    } else {
        addTask(text);
        resetForm();
        showMessage("Task added successfully.");
    }
});

// Handle task checkbox, edit and delete actions.
taskList.addEventListener("click", (event) => {
    const target = event.target;

    if (!(target instanceof HTMLElement)) {
        return;
    }

    const action = target.dataset.action;
    const taskId = target.dataset.id;

    if (!action || !taskId) {
        return;
    }

    if (action === "toggle" && target instanceof HTMLInputElement) {
        toggleTask(taskId);
    } else if (action === "edit") {
        editTask(taskId);
    } else if (action === "delete") {
        deleteTask(taskId);
    }
});

// Filter tasks.
filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
        currentFilter = button.dataset.filter;

        filterButtons.forEach((filterButton) => {
            const isActive = filterButton === button;

            filterButton.classList.toggle("active", isActive);
            filterButton.setAttribute(
                "aria-pressed",
                String(isActive)
            );
        });

        renderTasks();
    });
});

// Remove all completed tasks.
clearCompletedBtn.addEventListener("click", () => {
    const completed = tasks.filter((task) => task.completed);

    if (completed.length === 0) {
        return;
    }

    const confirmed = window.confirm(
        `Delete all ${completed.length} completed task(s)?`
    );

    if (!confirmed) {
        return;
    }

    tasks = tasks.filter((task) => !task.completed);

    if (editingTaskId !== null &&
        !tasks.some((task) => task.id === editingTaskId)) {
        resetForm();
    }

    saveTasks();
    renderTasks();
    showMessage("Completed tasks cleared.");
});

// Display today's date.
currentDate.textContent = new Intl.DateTimeFormat("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric"
}).format(new Date());

// Start the app.
tasks = loadTasks();
renderTasks();
