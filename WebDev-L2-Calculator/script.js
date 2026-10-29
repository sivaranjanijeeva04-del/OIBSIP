
const display = document.getElementById("display");
const buttons = document.querySelector(".buttons");

let firstOperand = null;
let operator = null;
let waitingForSecondOperand = false;
let hasError = false;

function enterNumber(value) {
    if (hasError) clearCalculator();

    if (waitingForSecondOperand) {
        display.value = value === "." ? "0." : value;
        waitingForSecondOperand = false;
        return;
    }

    if (value === "." && display.value.includes(".")) return;

    if (display.value === "0") {
        display.value = value === "." ? "0." : value;
    } else {
        display.value += value;
    }
}

function calculate(a, b, op) {
    switch (op) {
        case "+":
            return a + b;
        case "-":
            return a - b;
        case "*":
            return a * b;
        case "/":
            if (b === 0) return null;
            return a / b;
        default:
            return b;
    }
}

function formatResult(value) {
    if (!Number.isFinite(value)) return String(value);
    return String(Number(value.toPrecision(10)));
}

function inputOperator(nextOperator) {
    if (hasError) return;

    const inputValue = Number(display.value);

    if (operator && !waitingForSecondOperand) {
        const result = calculate(firstOperand, inputValue, operator);

        if (result === null) {
            showError();
            return;
        }

        display.value = formatResult(result);
        firstOperand = result;
    } else if (firstOperand === null || !operator) {
        firstOperand = inputValue;
    }

    operator = nextOperator;
    waitingForSecondOperand = true;
}

function showError() {
    display.value = "Error";
    firstOperand = null;
    operator = null;
    waitingForSecondOperand = true;
    hasError = true;
}

function clearCalculator() {
    display.value = "0";
    firstOperand = null;
    operator = null;
    waitingForSecondOperand = false;
    hasError = false;
}

function deleteLastCharacter() {
    if (hasError || waitingForSecondOperand) return;

    display.value = display.value.length > 1
        ? display.value.slice(0, -1)
        : "0";

    if (display.value === "-") display.value = "0";
}

buttons.addEventListener("click", function (event) {
    const button = event.target.closest("button");
    if (!button) return;

    if (button.dataset.value !== undefined) {
        const value = button.dataset.value;

        if ("0123456789.".includes(value) && value.length === 1) {
            enterNumber(value);
        } else {
            inputOperator(value);
        }
    }

    if (button.dataset.action === "clear") {
        clearCalculator();
    }

    if (button.dataset.action === "delete") {
        deleteLastCharacter();
    }

    if (button.dataset.action === "equals") {
        if (operator === null || waitingForSecondOperand || hasError) {
            return;
        }

        const secondOperand = Number(display.value);
        const result = calculate(
            firstOperand,
            secondOperand,
            operator
        );

        if (result === null) {
            showError();
            return;
        }

        display.value = formatResult(result);
        firstOperand = null;
        operator = null;
        waitingForSecondOperand = true;
    }
});
