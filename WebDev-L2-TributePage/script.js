
/* =========================
   Mobile Navigation
========================= */
const menuToggle = document.getElementById("menuToggle");
const navLinks = document.getElementById("navLinks");

menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("active");

    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.textContent = isOpen ? "✕" : "☰";
});

// Close mobile menu after clicking a navigation link
document.querySelectorAll(".nav-links a").forEach((link) => {
    link.addEventListener("click", () => {
        navLinks.classList.remove("active");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.textContent = "☰";
    });
});

/* =========================
   Inspirational Quote Button
========================= */
const quotes = [
    "Dream, dream, dream. Dreams transform into thoughts and thoughts result in action.",
    "You have to dream before your dreams can come true.",
    "Excellence is a continuous process and not an accident.",
    "Thinking should become your capital asset, no matter whatever ups and downs you come across in your life.",
    "Small aim is a crime; have great aim.",
    "Let us sacrifice our today so that our children can have a better tomorrow."
];

const quoteText = document.getElementById("quoteText");
const newQuoteBtn = document.getElementById("newQuoteBtn");

let previousQuoteIndex = 0;

newQuoteBtn.addEventListener("click", () => {
    let nextIndex;

    do {
        nextIndex = Math.floor(Math.random() * quotes.length);
    } while (quotes.length > 1 && nextIndex === previousQuoteIndex);

    previousQuoteIndex = nextIndex;
    quoteText.textContent = quotes[nextIndex];
});
