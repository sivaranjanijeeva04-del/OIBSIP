
"use strict";

const loginView = document.getElementById("loginView");
const signupView = document.getElementById("signupView");
const dashboardView = document.getElementById("dashboardView");

const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");

const loginMessage = document.getElementById("loginMessage");
const signupMessage = document.getElementById("signupMessage");

const USERS_KEY = "securespace_users";
const SESSION_KEY = "securespace_session";

function getUsers() {
    try {
        const users = JSON.parse(localStorage.getItem(USERS_KEY) || "[]");
        return Array.isArray(users) ? users : [];
    } catch {
        return [];
    }
}

function showView(view) {
    [loginView, signupView, dashboardView].forEach(section => {
        section.hidden = section !== view;
    });
}

function showMessage(element, message, success = false) {
    element.textContent = message;
    element.style.color = success ? "#16803c" : "#dc2626";
}

function clearMessages() {
    showMessage(loginMessage, "");
    showMessage(signupMessage, "");
}

function makeSalt() {
    const bytes = crypto.getRandomValues(new Uint8Array(16));

    return Array.from(bytes, byte =>
        byte.toString(16).padStart(2, "0")
    ).join("");
}

async function hashPassword(password, salt) {
    if (!crypto.subtle) {
        throw new Error("Secure browser context required");
    }

    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(password),
        "PBKDF2",
        false,
        ["deriveBits"]
    );

    const result = await crypto.subtle.deriveBits(
        {
            name: "PBKDF2",
            salt: new TextEncoder().encode(salt),
            iterations: 100000,
            hash: "SHA-256"
        },
        key,
        256
    );

    return Array.from(new Uint8Array(result), byte =>
        byte.toString(16).padStart(2, "0")
    ).join("");
}

function saveUsers(users) {
    try {
        localStorage.setItem(USERS_KEY, JSON.stringify(users));
        return true;
    } catch {
        return false;
    }
}

// Navigate between forms
document.getElementById("showSignup").addEventListener("click", () => {
    clearMessages();
    signupForm.reset();
    showView(signupView);
});

document.getElementById("showLogin").addEventListener("click", () => {
    clearMessages();
    loginForm.reset();
    showView(loginView);
});

// Show/hide passwords
document.querySelectorAll(".toggle-password").forEach(button => {
    button.addEventListener("click", () => {
        const input = document.getElementById(button.dataset.target);

        if (!input) return;

        const showPassword = input.type === "password";
        input.type = showPassword ? "text" : "password";
        button.textContent = showPassword ? "Hide" : "Show";
    });
});

// Create account
signupForm.addEventListener("submit", async event => {
    event.preventDefault();
    showMessage(signupMessage, "");

    const name = document.getElementById("signupName").value.trim();
    const email = document.getElementById("signupEmail")
        .value.trim().toLowerCase();
    const password = document.getElementById("signupPassword").value;
    const confirmPassword =
        document.getElementById("confirmPassword").value;

    if (!name || !email || !password || !confirmPassword) {
        showMessage(signupMessage, "Please fill in all fields.");
        return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        showMessage(signupMessage, "Please enter a valid email address.");
        return;
    }

    if (password.length < 8) {
        showMessage(signupMessage, "Password must be at least 8 characters.");
        return;
    }

    if (!/[A-Z]/.test(password) ||
        !/[a-z]/.test(password) ||
        !/[0-9]/.test(password)) {
        showMessage(
            signupMessage,
            "Use uppercase, lowercase and at least one number."
        );
        return;
    }

    if (password !== confirmPassword) {
        showMessage(signupMessage, "Passwords do not match.");
        return;
    }

    const users = getUsers();

    if (users.some(user => user.email === email)) {
        showMessage(
            signupMessage,
            "This email is already registered. Please log in."
        );
        return;
    }

    const submitButton = signupForm.querySelector(
        'button[type="submit"]'
    );
    submitButton.disabled = true;
    submitButton.textContent = "Creating account...";

    try {
        const salt = makeSalt();
        const passwordHash = await hashPassword(password, salt);

        users.push({
            name,
            email,
            salt,
            passwordHash
        });

        if (!saveUsers(users)) {
            throw new Error("Unable to save account");
        }

        signupForm.reset();
        loginForm.reset();
        clearMessages();
        showView(loginView);

        showMessage(
            loginMessage,
            "Account created successfully! Please sign in.",
            true
        );
    } catch {
        showMessage(
            signupMessage,
            "Could not create account. Run this project using VS Code Live Server."
        );
    } finally {
        submitButton.disabled = false;
        submitButton.textContent = "Create account";
    }
});

// Log in
loginForm.addEventListener("submit", async event => {
    event.preventDefault();
    showMessage(loginMessage, "");

    const email = document.getElementById("loginEmail")
        .value.trim().toLowerCase();
    const password = document.getElementById("loginPassword").value;

    const user = getUsers().find(item => item.email === email);

    if (!user) {
        showMessage(
            loginMessage,
            "Account not found. Please create an account first."
        );
        return;
    }

    try {
        const enteredHash = await hashPassword(password, user.salt);

        if (enteredHash !== user.passwordHash) {
            showMessage(loginMessage, "Incorrect password. Try again.");
            return;
        }

        sessionStorage.setItem(
            SESSION_KEY,
            JSON.stringify({ email: user.email })
        );

        loginForm.reset();
        showDashboard(user);
    } catch {
        showMessage(loginMessage, "Login failed. Please try again.");
    }
});

// Display dashboard
function showDashboard(user) {
    document.getElementById("dashboardName").textContent = user.name;
    document.getElementById("dashboardEmail").textContent = user.email;

    showView(dashboardView);
}

// Log out
document.getElementById("logoutBtn").addEventListener("click", () => {
    sessionStorage.removeItem(SESSION_KEY);
    loginForm.reset();
    clearMessages();

    showView(loginView);
    showMessage(loginMessage, "You have logged out successfully.", true);
});

// Restore session after refresh
function restoreSession() {
    try {
        const session = JSON.parse(
            sessionStorage.getItem(SESSION_KEY) || "null"
        );

        if (session && session.email) {
            const user = getUsers().find(
                item => item.email === session.email
            );

            if (user) {
                showDashboard(user);
                return;
            }
        }
    } catch {
        sessionStorage.removeItem(SESSION_KEY);
    }

    showView(loginView);
}

restoreSession();
