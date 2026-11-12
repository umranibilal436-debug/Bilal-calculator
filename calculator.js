/**
 * BILAL SCIENTIFIC CALCULATOR - Mathematical Engine
 * Accurate Expression Lexer, Parser, and Evaluator
 * Supports:
 *  - High-precision arithmetic and floating-point correction
 *  - DEG / RAD modes for trigonometric and inverse trigonometric functions
 *  - Full operator precedence (PEMDAS/BODMAS)
 *  - Implicit multiplication: 2(3), 2π, 4sin(30), (1+2)(3+4)
 *  - Factorial, powers, roots, logs, exponentials, abs, reciprocal
 *  - Robust domain error & division-by-zero handling
 */

class MathEngine {
  constructor() {
    this.angleMode = 'DEG'; // 'DEG' or 'RAD'
    this.lastAnswer = 0;
    this.memory = 0;
  }

  setAngleMode(mode) {
    if (mode === 'DEG' || mode === 'RAD') {
      this.angleMode = mode;
    }
  }

  getAngleMode() {
    return this.angleMode;
  }

  setAnswer(val) {
    if (typeof val === 'number' && !isNaN(val) && isFinite(val)) {
      this.lastAnswer = val;
    }
  }

  getAnswer() {
    return this.lastAnswer;
  }

  // Memory functions
  memoryClear() {
    this.memory = 0;
  }

  memoryRecall() {
    return this.memory;
  }

  memoryAdd(val) {
    this.memory += Number(val) || 0;
  }

  memorySubtract(val) {
    this.memory -= Number(val) || 0;
  }

  memoryStore(val) {
    this.memory = Number(val) || 0;
  }

  hasMemory() {
    return this.memory !== 0;
  }

  /**
   * Accurate Factorial
   */
  factorial(n) {
    if (n < 0) throw new Error('Factorial of negative number undefined');
    if (!Number.isInteger(n)) {
      // Gamma function approximation for fractional values if needed
      return this.gamma(n + 1);
    }
    if (n > 170) throw new Error('Result exceeds calculator limit (overflow)');
    let res = 1;
    for (let i = 2; i <= n; i++) {
      res *= i;
    }
    return res;
  }

  // Lanczos gamma approximation
  gamma(z) {
    const p = [
      676.5203681218851, -1259.1392167224028,
      771.32342877765313, -176.61502916214059,
      12.507343278686905, -0.138571095836524,
      9.9843695780195716e-6, 1.5056327351493116e-7
    ];
    if (z < 0.5) {
      return Math.PI / (Math.sin(Math.PI * z) * this.gamma(1 - z));
    }
    z -= 1;
    let x = 0.99999999999980993;
    for (let i = 0; i < p.length; i++) {
      x += p[i] / (z + i + 1);
    }
    const t = z + p.length - 0.5;
    return Math.sqrt(2 * Math.PI) * Math.pow(t, z + 0.5) * Math.exp(-t) * x;
  }

  /**
   * Angle conversion utilities
   */
  toRadians(angle) {
    return this.angleMode === 'DEG' ? (angle * Math.PI) / 180 : angle;
  }

  fromRadians(rad) {
    return this.angleMode === 'DEG' ? (rad * 180) / Math.PI : rad;
  }

  /**
   * Clean floating-point artifacts like 0.1 + 0.2 = 0.30000000000000004
   * and clean sin(180 deg) = 0 instead of 1.2246e-16
   */
  cleanFloat(num, precision = 12) {
    if (typeof num !== 'number' || isNaN(num)) return num;
    if (!isFinite(num)) return num;

    // Zero out very tiny numbers close to zero
    if (Math.abs(num) < 1e-14) return 0;

    // Check if within epsilon of an integer
    const rounded = Math.round(num);
    if (Math.abs(num - rounded) < 1e-12) {
      return rounded;
    }

    // Fix precision
    const fixed = Number(num.toPrecision(precision));
    return fixed;
  }

  /**
   * Trigonometric & Scientific base functions
   */
  sin(x) {
    if (this.angleMode === 'DEG') {
      const normalized = ((x % 360) + 360) % 360;
      if (normalized === 0 || normalized === 180) return 0;
      if (normalized === 90) return 1;
      if (normalized === 270) return -1;
    }
    return this.cleanFloat(Math.sin(this.toRadians(x)));
  }

  cos(x) {
    if (this.angleMode === 'DEG') {
      const normalized = ((x % 360) + 360) % 360;
      if (normalized === 90 || normalized === 270) return 0;
      if (normalized === 0) return 1;
      if (normalized === 180) return -1;
    }
    return this.cleanFloat(Math.cos(this.toRadians(x)));
  }

  tan(x) {
    if (this.angleMode === 'DEG') {
      const normalized = ((x % 360) + 360) % 360;
      if (normalized === 90 || normalized === 270) {
        throw new Error('Tangent undefined at 90° + k·180°');
      }
      if (normalized === 0 || normalized === 180) return 0;
      if (normalized === 45 || normalized === 225) return 1;
      if (normalized === 135 || normalized === 315) return -1;
    } else {
      // Check for odd multiples of pi/2 in rad
      const halfPi = Math.PI / 2;
      const factor = x / halfPi;
      if (Math.abs(Math.round(factor) - factor) < 1e-14 && Math.round(factor) % 2 !== 0) {
        throw new Error('Tangent undefined at π/2 + k·π');
      }
    }
    const val = Math.tan(this.toRadians(x));
    return this.cleanFloat(val);
  }

  asin(x) {
    if (x < -1 || x > 1) {
      throw new Error('Domain Error: asin input must be between -1 and 1');
    }
    const rad = Math.asin(x);
    return this.cleanFloat(this.fromRadians(rad));
  }

  acos(x) {
    if (x < -1 || x > 1) {
      throw new Error('Domain Error: acos input must be between -1 and 1');
    }
    const rad = Math.acos(x);
    return this.cleanFloat(this.fromRadians(rad));
  }

  atan(x) {
    const rad = Math.atan(x);
    return this.cleanFloat(this.fromRadians(rad));
  }

  log10(x) {
    if (x <= 0) {
      throw new Error('Domain Error: log of non-positive number');
    }
    return this.cleanFloat(Math.log10(x));
  }

  ln(x) {
    if (x <= 0) {
      throw new Error('Domain Error: ln of non-positive number');
    }
    return this.cleanFloat(Math.log(x));
  }

  sqrt(x) {
    if (x < 0) {
      throw new Error('Domain Error: square root of negative number');
    }
    return this.cleanFloat(Math.sqrt(x));
  }

  cbrt(x) {
    return this.cleanFloat(Math.cbrt(x));
  }

  reciprocal(x) {
    if (x === 0) {
      throw new Error('Cannot divide by zero');
    }
    return this.cleanFloat(1 / x);
  }

  abs(x) {
    return Math.abs(x);
  }

  power(base, exponent) {
    if (base < 0 && !Number.isInteger(exponent)) {
      throw new Error('Complex result not supported in real mode');
    }
    if (base === 0 && exponent < 0) {
      throw new Error('Cannot divide by zero (0^negative)');
    }
    return this.cleanFloat(Math.pow(base, exponent));
  }

  exp(x) {
    return this.cleanFloat(Math.exp(x));
  }

  pow10(x) {
    return this.cleanFloat(Math.pow(10, x));
  }

  /**
   * Preprocessing & Tokenization
   * Normalizes human input into clean tokens:
   *  - Replaces × with *, ÷ with /
   *  - Normalizes sin⁻¹, cos⁻¹, tan⁻¹ to asin, acos, atan
   *  - Normalizes ∛ to cbrt, √ to sqrt
   *  - Injects implicit multiplication: 2(3) -> 2*(3), 2π -> 2*π, 3sin(x) -> 3*sin(x), etc.
   */
  tokenize(rawExpr) {
    if (!rawExpr || !rawExpr.trim()) {
      throw new Error('Empty expression');
    }

    let str = rawExpr.trim();

    // Canonical glyph replacements
    str = str.replace(/×/g, '*')
             .replace(/÷/g, '/')
             .replace(/−/g, '-')
             .replace(/–/g, '-')
             .replace(/²/g, '^2')
             .replace(/³/g, '^3')
             .replace(/sin⁻¹|asin|arcsin/gi, 'asin')
             .replace(/cos⁻¹|acos|arccos/gi, 'acos')
             .replace(/tan⁻¹|atan|arctan/gi, 'atan')
             .replace(/cbrt|∛/gi, 'cbrt ')
             .replace(/sqrt|√/gi, 'sqrt ')
             .replace(/π|PI/g, Math.PI.toString())
             .replace(/\bAns\b/gi, this.lastAnswer.toString())
             .replace(/\bEXP\b/gi, 'e');

    // Auto-wrap functions without parentheses: e.g. sqrt 16 -> sqrt(16), sin 90 -> sin(90)
    const funcs = ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'log', 'ln', 'sqrt', 'cbrt', 'abs', 'exp', 'pow10'];
    funcs.forEach(fn => {
      const re = new RegExp('\\b' + fn + '\\s*([0-9]+(?:\\.[0-9]+)?)\\b', 'gi');
      str = str.replace(re, `${fn}($1)`);
    });

    // Handle e as constant vs scientific notation:
    str = str.replace(/([0-9]+)\s*e\s*([+-]?[0-9]+)/gi, '$1e$2');
    str = str.replace(/\be\b/g, Math.E.toString());

    // Tokenizer regex matching numbers, functions, operators, parentheses
    const tokenRegex = /\s*([0-9]+(?:\.[0-9]+)?(?:e[+-]?[0-9]+)?|[a-zA-Z_][a-zA-Z0-9_]*|\+|-|\*|\/|\^|!|%|\(|\)|,)\s*/g;
    const rawTokens = [];
    let match;
    let lastIndex = 0;

    while ((match = tokenRegex.exec(str)) !== null) {
      if (match.index !== lastIndex) {
        const unexpected = str.substring(lastIndex, match.index).trim();
        if (unexpected) {
          throw new Error(`Unexpected character or symbol: "${unexpected}"`);
        }
      }
      rawTokens.push(match[1]);
      lastIndex = tokenRegex.lastIndex;
    }

    if (lastIndex < str.length) {
      const remaining = str.substring(lastIndex).trim();
      if (remaining) {
        throw new Error(`Unexpected character: "${remaining}"`);
      }
    }

    // Insert implicit multiplications
    // Cases:
    //  number followed by '(', function, or constant
    //  ')' followed by '(', number, function, or constant
    //  '!' followed by number, '(', function, or constant
    const tokens = [];
    const isNum = (t) => /^[0-9]+(?:\.[0-9]+)?(?:e[+-]?[0-9]+)?$/i.test(t);
    const isFunc = (t) => ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'log', 'ln', 'sqrt', 'cbrt', 'abs', 'exp', 'pow10'].includes(t.toLowerCase());

    for (let i = 0; i < rawTokens.length; i++) {
      const curr = rawTokens[i];
      tokens.push(curr);

      if (i + 1 < rawTokens.length) {
        const next = rawTokens[i + 1];

        const currIsNum = isNum(curr);
        const nextIsNum = isNum(next);
        const currIsFunc = isFunc(curr);
        const nextIsFunc = isFunc(next);

        // e.g. 2(3) -> 2 * (3)
        if (currIsNum && (next === '(' || nextIsFunc)) {
          tokens.push('*');
        }
        // e.g. (2+3)(4) -> (2+3) * (4)
        else if (curr === ')' && (next === '(' || nextIsNum || nextIsFunc)) {
          tokens.push('*');
        }
        // e.g. 5! 2 -> 5! * 2 or 5! (2) -> 5! * (2)
        else if (curr === '!' && (nextIsNum || next === '(' || nextIsFunc)) {
          tokens.push('*');
        }
        // e.g. % followed by number or '('
        else if (curr === '%' && (nextIsNum || next === '(' || nextIsFunc)) {
          tokens.push('*');
        }
      }
    }

    return tokens;
  }

  /**
   * Shunting-yard Algorithm: Infix to Reverse Polish Notation (RPN)
   */
  toRPN(tokens) {
    const outputQueue = [];
    const operatorStack = [];

    const precedence = {
      '+': 2,
      '-': 2,
      '*': 3,
      '/': 3,
      '%': 3,
      'u-': 4, // Unary minus
      'u+': 4, // Unary plus
      '^': 5,
      '!': 6   // Postfix factorial
    };

    const associativity = {
      '+': 'Left',
      '-': 'Left',
      '*': 'Left',
      '/': 'Left',
      '%': 'Left',
      'u-': 'Right',
      'u+': 'Right',
      '^': 'Right',
      '!': 'Left'
    };

    const isFunction = (t) => ['sin', 'cos', 'tan', 'asin', 'acos', 'atan', 'log', 'ln', 'sqrt', 'cbrt', 'abs', 'exp', 'pow10'].includes(t.toLowerCase());

    let expectUnary = true;

    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      const lower = token.toLowerCase();

      // Number
      if (/^[0-9]+(?:\.[0-9]+)?(?:e[+-]?[0-9]+)?$/i.test(token)) {
        outputQueue.push({ type: 'num', value: parseFloat(token) });
        expectUnary = false;
      }
      // Function
      else if (isFunction(lower)) {
        operatorStack.push({ type: 'func', value: lower });
        expectUnary = true;
      }
      // Postfix Factorial !
      else if (token === '!') {
        while (
          operatorStack.length > 0 &&
          operatorStack[operatorStack.length - 1].type === 'op' &&
          (precedence[operatorStack[operatorStack.length - 1].value] > precedence['!'] ||
            (precedence[operatorStack[operatorStack.length - 1].value] === precedence['!'] && associativity['!'] === 'Left'))
        ) {
          outputQueue.push(operatorStack.pop());
        }
        operatorStack.push({ type: 'postfix', value: '!' });
        expectUnary = false;
      }
      // Postfix Percentage %
      else if (token === '%') {
        // Percentage can act as unary postfix (x / 100) or binary mod
        outputQueue.push({ type: 'postfix', value: '%' });
        expectUnary = false;
      }
      // Operators (+, -, *, /, ^)
      else if (['+', '-', '*', '/', '^'].includes(token)) {
        let op = token;
        if (expectUnary) {
          if (token === '-') op = 'u-';
          else if (token === '+') op = 'u+';
          else throw new Error(`Unexpected operator "${token}"`);
        }

        while (
          operatorStack.length > 0 &&
          operatorStack[operatorStack.length - 1].value !== '(' &&
          (
            operatorStack[operatorStack.length - 1].type === 'func' ||
            (operatorStack[operatorStack.length - 1].type === 'op' &&
              (precedence[operatorStack[operatorStack.length - 1].value] > precedence[op] ||
                (precedence[operatorStack[operatorStack.length - 1].value] === precedence[op] && associativity[op] === 'Left'))
            )
          )
        ) {
          outputQueue.push(operatorStack.pop());
        }

        operatorStack.push({ type: 'op', value: op });
        expectUnary = true;
      }
      // Left Parenthesis
      else if (token === '(') {
        operatorStack.push({ type: 'paren', value: '(' });
        expectUnary = true;
      }
      // Right Parenthesis
      else if (token === ')') {
        let foundOpenParen = false;
        while (operatorStack.length > 0) {
          const top = operatorStack.pop();
          if (top.value === '(') {
            foundOpenParen = true;
            break;
          }
          outputQueue.push(top);
        }
        if (!foundOpenParen) {
          throw new Error('Mismatched parentheses: missing "("');
        }

        // If top of stack is a function, pop it to output
        if (
          operatorStack.length > 0 &&
          operatorStack[operatorStack.length - 1].type === 'func'
        ) {
          outputQueue.push(operatorStack.pop());
        }
        expectUnary = false;
      } else {
        throw new Error(`Unknown token: "${token}"`);
      }
    }

    while (operatorStack.length > 0) {
      const top = operatorStack.pop();
      if (top.value === '(' || top.value === ')') {
        throw new Error('Mismatched parentheses: unclosed "("');
      }
      outputQueue.push(top);
    }

    return outputQueue;
  }

  /**
   * Evaluate RPN queue
   */
  evaluateRPN(rpn) {
    const stack = [];

    for (let i = 0; i < rpn.length; i++) {
      const item = rpn[i];

      if (item.type === 'num') {
        stack.push(item.value);
      } else if (item.type === 'postfix') {
        if (stack.length < 1) throw new Error('Syntax error before ' + item.value);
        const a = stack.pop();
        if (item.value === '!') {
          stack.push(this.factorial(a));
        } else if (item.value === '%') {
          stack.push(this.cleanFloat(a / 100));
        }
      } else if (item.type === 'func') {
        if (stack.length < 1) throw new Error(`Missing argument for function ${item.value}`);
        const arg = stack.pop();
        let res;
        switch (item.value) {
          case 'sin': res = this.sin(arg); break;
          case 'cos': res = this.cos(arg); break;
          case 'tan': res = this.tan(arg); break;
          case 'asin': res = this.asin(arg); break;
          case 'acos': res = this.acos(arg); break;
          case 'atan': res = this.atan(arg); break;
          case 'log': res = this.log10(arg); break;
          case 'ln': res = this.ln(arg); break;
          case 'sqrt': res = this.sqrt(arg); break;
          case 'cbrt': res = this.cbrt(arg); break;
          case 'abs': res = this.abs(arg); break;
          case 'exp': res = this.exp(arg); break;
          case 'pow10': res = this.pow10(arg); break;
          default: throw new Error(`Unknown function ${item.value}`);
        }
        stack.push(res);
      } else if (item.type === 'op') {
        if (item.value === 'u-') {
          if (stack.length < 1) throw new Error('Syntax error with unary minus');
          stack.push(-stack.pop());
        } else if (item.value === 'u+') {
          if (stack.length < 1) throw new Error('Syntax error with unary plus');
          // No-op for unary +
        } else {
          if (stack.length < 2) throw new Error(`Syntax error around operator "${item.value}"`);
          const b = stack.pop();
          const a = stack.pop();
          let res;
          switch (item.value) {
            case '+': res = this.cleanFloat(a + b); break;
            case '-': res = this.cleanFloat(a - b); break;
            case '*': res = this.cleanFloat(a * b); break;
            case '/':
              if (b === 0) throw new Error('Cannot divide by zero');
              res = this.cleanFloat(a / b);
              break;
            case '^': res = this.power(a, b); break;
            case '%':
              if (b === 0) throw new Error('Cannot modulo by zero');
              res = this.cleanFloat(a % b);
              break;
            default: throw new Error(`Unknown operator "${item.value}"`);
          }
          stack.push(res);
        }
      }
    }

    if (stack.length !== 1) {
      throw new Error('Invalid expression format');
    }

    const finalVal = stack[0];
    if (typeof finalVal !== 'number' || isNaN(finalVal)) {
      throw new Error('Calculation resulted in NaN');
    }

    return finalVal;
  }

  /**
   * Main evaluate method: takes mathematical string expression, returns evaluated result
   */
  calculate(rawExpr) {
    if (!rawExpr || !rawExpr.trim()) {
      return 0;
    }

    // Auto-balance unclosed parentheses if user hits equals early
    let balancedExpr = rawExpr;
    const openParens = (balancedExpr.match(/\(/g) || []).length;
    const closeParens = (balancedExpr.match(/\)/g) || []).length;
    if (openParens > closeParens) {
      balancedExpr += ')'.repeat(openParens - closeParens);
    }

    const tokens = this.tokenize(balancedExpr);
    const rpn = this.toRPN(tokens);
    const result = this.evaluateRPN(rpn);

    this.setAnswer(result);
    return result;
  }

  /**
   * Format number for clear display:
   *  - Avoids scientific notation for reasonably sized numbers
   *  - Adds standard formatting
   *  - Precision control
   */
  formatResult(val, maxDigits = 14) {
    if (typeof val !== 'number') return String(val);
    if (!isFinite(val)) return String(val);

    // If zero
    if (val === 0) return '0';

    // Check if integer
    if (Number.isInteger(val) && Math.abs(val) < 1e14) {
      return val.toString();
    }

    // Very large or very tiny -> scientific notation
    if (Math.abs(val) >= 1e14 || (Math.abs(val) < 1e-6 && val !== 0)) {
      return val.toExponential(8).replace(/\.?0+e/, 'e');
    }

    // Standard decimal formatting
    const str = val.toPrecision(12);
    // Remove trailing decimal zeroes
    return parseFloat(str).toString();
  }
}

// Export for browser and node/testing environments
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MathEngine;
}
