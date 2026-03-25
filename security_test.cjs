
const sanitizeInput = (val, maxLength = 200, fallback = "Unknown") => {
  if (typeof val !== 'string') return fallback;
  let sanitized = val.trim().slice(0, maxLength);
  sanitized = sanitized.replace(/[\r\n]/g, ' ');
  return sanitized || fallback;
};

const validateNumber = (val, fallback, min = -Infinity, max = Infinity) => {
  const num = Number(val);
  if (Number.isNaN(num)) return fallback;
  return Math.min(Math.max(num, min), max);
};

const testSanitize = () => {
  console.log("Testing sanitizeInput...");
  if (sanitizeInput("Hello World") !== "Hello World") throw new Error("Basic string failed");
  if (sanitizeInput("   Trim me   ") !== "Trim me") throw new Error("Trim failed");
  if (sanitizeInput("A".repeat(300), 50).length !== 50) throw new Error("Truncate failed");
  if (sanitizeInput(null) !== "Unknown") throw new Error("Null check failed");
  if (sanitizeInput(123) !== "Unknown") throw new Error("Type check failed");
  if (sanitizeInput("Line 1\nLine 2") !== "Line 1 Line 2") throw new Error("Newline replacement failed");
  if (sanitizeInput("", 200, "Default") !== "Default") throw new Error("Empty string fallback failed");
  console.log("sanitizeInput tests passed!");
};

const testValidateNumber = () => {
  console.log("Testing validateNumber...");
  if (validateNumber(10, 0) !== 10) throw new Error("Basic number failed");
  if (validateNumber("20", 0) !== 20) throw new Error("String number failed");
  if (validateNumber("abc", 5) !== 5) throw new Error("NaN fallback failed");
  if (validateNumber(150, 0, 0, 100) !== 100) throw new Error("Max constraint failed");
  if (validateNumber(-10, 0, 0, 100) !== 0) throw new Error("Min constraint failed");
  console.log("validateNumber tests passed!");
};

try {
  testSanitize();
  testValidateNumber();
  console.log("All security tests passed!");
} catch (error) {
  console.error("Test failed:", error.message);
  process.exit(1);
}
