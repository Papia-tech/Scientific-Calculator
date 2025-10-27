const display = document.getElementById("display");
const historyList = document.getElementById("historyList");
let degreeMode = true;
let memory = 0;
let lastAns = 0;

// Core functions
let expression = ""; // new global variable

function appendValue(value) {
    display.value += value; // what user sees
    expression += value;    // what JS evaluates
}

function clearDisplay() {
    display.value = "";
    expression = "";
}

function appendSymbol(displaySymbol, evalValue) {
    display.value += displaySymbol;  // what user sees
    expression += evalValue;         // what JS evaluates
}

function toggleDegRad() {
    degreeMode = !degreeMode;
    event.target.textContent = degreeMode ? "DEG" : "RAD";
}

function calculateResult() {
    try {
        // Save user-entered expression for history before processing
        const userExpression = display.value.trim();

        let expr = expression;

        // Auto-fix: add missing closing parentheses
        let openCount = (expr.match(/\(/g) || []).length;
        let closeCount = (expr.match(/\)/g) || []).length;
        while (closeCount < openCount) {
            expr += ')';
            closeCount++;
        }

        // Handle factorial
        expr = expr.replace(/(\d+)!/g, (match, n) => `factorial(${n})`);

        // Replace ^ with ** for exponentiation
        expr = expr.replace(/\^/g, "**");

        // Replace √number or √(...) with Math.sqrt(...)
        //expr = expr.replace(/√\(?([^\)]+)\)?/g, 'Math.sqrt($1)');

        // Before eval
        expr = expr.replace(/√(\d+(\.\d+)?|\([^\)]+\))/g, 'Math.sqrt($1)');

        // Replace trig function names with Math.*
        expr = expr.replace(/\b(sin|cos|tan|asin|acos|atan)\b/g, fn => `Math.${fn}`);

        // Add * between numbers and parentheses
        expr = expr.replace(/(\d)\(/g, '$1*(')
            .replace(/\)(\d)/g, ')*$1')
            .replace(/\)\(/g, ')*(');

        // Handle nPr and nCr (like 5P2 or 6C3)
        expr = expr.replace(/(\d+)P(\d+)/g, (_, n, r) => `nPr(${n},${r})`);
        expr = expr.replace(/(\d+)C(\d+)/g, (_, n, r) => `nCr(${n},${r})`);

        // Convert degree to radian for trig functions if in DEG mode
        if (degreeMode) {
            expr = expr.replace(/Math\.(sin|cos|tan)\(/g, 'Math.$1(Math.PI/180*');
        }

        // ✅ Evaluate safely
        let result = eval(expr);

        // --- Handle floating point rounding and special trig cases ---
        // Round to 10 decimal places to remove minor float errors
        result = Math.round(result * 1e10) / 1e10;

        // Fix near-zero values (like cos(90) = 6.123e-17)
        if (Math.abs(result) < 1e-10) result = 0;

        // Fix common perfect trig values
        if (Math.abs(result - 1) < 1e-10) result = 1;
        if (Math.abs(result + 1) < 1e-10) result = -1;

        lastAns = result;

        // Add clean readable entry to history
        addToHistory(userExpression, result);

        display.value = result;
        expression = result.toString();
    } catch (err) {
        display.value = "Error";
    }
}




function xRoot() {
    try {
        // Split input by comma: "x,y"
        let [x, y] = display.value.split(',').map(Number);
        if (isNaN(x) || isNaN(y)) throw Error();
        const result = Math.pow(y, 1 / x);  // y^(1/x)
        display.value = result;
        addToHistory(`${x}√${y}`, result);
    } catch {
        display.value = "Error";
    }
}

function appendSqrt() {
    display.value += '√';
    expression += '√'; // just placeholder, let calculateResult replace it
}

function multiplyTenPower() {
    // Append to display for user
    display.value += '×10^';
    // Append to expression for eval: replace ^ with ** later
    expression += '*10^';
}





function appendTrig(fn) {
    // Display: show as "tan 45" or "sin 30"
    display.value += fn + ' ';
    // Expression: add function call with parentheses
    expression += fn + '(';
}


// Function to calculate factorial
function calculateFactorialButton() {
    try {
        const n = eval(display.value);
        if (n < 0 || !Number.isInteger(n)) throw Error();
        let res = 1;
        for (let i = 1; i <= n; i++) res *= i;
        display.value = res;
        expression = res.toString();
        addToHistory(`${n}!`, res);
    } catch {
        display.value = "Error";
    }
}

// Function for nPr
function nPr(n, r) {
    return factorial(n) / factorial(n - r);
}

// Function for nCr
function nCr(n, r) {
    return factorial(n) / (factorial(r) * factorial(n - r));
}


// Scientific functions
function factorial(n) {
    if (n < 0 || !Number.isInteger(n)) throw new Error("Invalid input for factorial");
    let res = 1;
    for (let i = 2; i <= n; i++) res *= i;
    return res;
}

function appendFactorial() {
    display.value += '!';
    expression += '!';
}


function square() {
    display.value += '²';       // what user sees
    expression += '**2';        // what JS evaluates later
}


function reciprocal() {
    try {
        const n = eval(expression); // use expression, not display.value
        const res = 1 / n;
        display.value = res;
        expression = res.toString(); // update expression
        addToHistory(`1/(${n})`, res);
    } catch {
        display.value = "Error";
        expression = "";
    }
}

function appendPermutation() {
    display.value += 'P';
    expression += 'P';
}

function appendCombination() {
    display.value += 'C';
    expression += 'C';
}

// Memory operations
function memoryAdd() { memory += eval(display.value || 0); }
function memorySubtract() { memory -= eval(display.value || 0); }
function memoryRecall() { display.value += memory; }
function memoryClear() { memory = 0; }

// History
function addToHistory(expression, result) {
    const p = document.createElement("p");
    p.textContent = `${expression} = ${result}`;
    historyList.appendChild(p);
    historyList.scrollTop = historyList.scrollHeight;
}
function clearHistory() { historyList.innerHTML = ""; }

function deleteLast() {
    display.value = display.value.slice(0, -1);
    expression = expression.slice(0, -1);
}


// Keyboard input
document.addEventListener("keydown", e => {
    const k = e.key;
    if (/[\d+\-*/().]/.test(k)) appendValue(k);
    else if (k === "Enter" || k === "=") calculateResult();
    else if (k === "Backspace") deleteLast();
    else if (k.toLowerCase() === "c") clearDisplay();
});

const historyPanel = document.getElementById('historyPanel');
const calculator = document.querySelector('.calculator');

historyPanel.addEventListener('click', () => {
    historyPanel.classList.add('active');
    calculator.classList.add('behind');
});

// Optional: click calculator to bring it forward again
calculator.addEventListener('click', () => {
    historyPanel.classList.remove('active');
    calculator.classList.remove('behind');
});

const toggleBtn = document.getElementById('toggleBtn');

toggleBtn.addEventListener('click', () => {
    if (document.body.classList.contains('neon')) {
        document.body.classList.replace('neon', 'dark');
        toggleBtn.textContent = "🔘"; // dark theme emoji
    } else {
        document.body.classList.replace('dark', 'neon');
        toggleBtn.textContent = "⚫"; // neon theme emoji
    }
});