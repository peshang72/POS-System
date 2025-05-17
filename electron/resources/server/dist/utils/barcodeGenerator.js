/**
 * Utility functions for barcode generation
 */

/**
 * Generates a standard EAN-13 barcode
 * Format: Country Code (3 digits) + Manufacturer Code (4 digits) + Product Code (5 digits) + Check Digit (1 digit)
 * @param {Object} options - Configuration options
 * @param {string} options.countryCode - 3-digit country code (default: '999' for internal use)
 * @param {string} options.manufacturerCode - 4-digit manufacturer code (or store code)
 * @returns {string} - Generated barcode
 */
function generateEAN13Barcode(options = {}) {
  // Default options
  const countryCode = options.countryCode || "999"; // Default country code for internal use
  const manufacturerCode = options.manufacturerCode || "0001"; // Default manufacturer code

  // Generate a random 5-digit product code
  const productCode = Math.floor(10000 + Math.random() * 90000).toString();

  // Combine parts (without check digit)
  const barcodeWithoutCheck = `${countryCode}${manufacturerCode}${productCode}`;

  // Calculate check digit
  const checkDigit = calculateEAN13CheckDigit(barcodeWithoutCheck);

  // Return complete barcode
  return `${barcodeWithoutCheck}${checkDigit}`;
}

/**
 * Calculates the check digit for an EAN-13 barcode
 * @param {string} barcode - Barcode without check digit (12 digits)
 * @returns {string} - Check digit
 */
function calculateEAN13CheckDigit(barcode) {
  // Ensure we have 12 digits
  if (barcode.length !== 12) {
    throw new Error("Barcode must be 12 digits for EAN-13");
  }

  // Calculate check digit using the EAN-13 algorithm
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(barcode[i], 10);
    // Odd positions (0-based index, even positions in 1-based counting) have weight 1
    // Even positions (0-based index, odd positions in 1-based counting) have weight 3
    sum += digit * (i % 2 === 0 ? 1 : 3);
  }

  // The check digit is the smallest number that makes the sum divisible by 10
  const checkDigit = (10 - (sum % 10)) % 10;
  return checkDigit.toString();
}

/**
 * Generates a unique sequential barcode based on a prefix and a counter
 * @param {Object} options - Configuration options
 * @param {string} options.prefix - Prefix for the barcode (default: 'STORE')
 * @param {number} options.counter - Sequential counter
 * @param {number} options.padding - Padding length for the counter (default: 8)
 * @returns {string} - Generated barcode
 */
function generateSequentialBarcode(options = {}) {
  const prefix = options.prefix || "STORE";
  const padding = options.padding || 8;

  // Pad counter with zeros
  const paddedCounter = options.counter.toString().padStart(padding, "0");

  return `${prefix}${paddedCounter}`;
}

/**
 * Validates if a barcode is a valid EAN-13
 * @param {string} barcode - The barcode to validate
 * @returns {boolean} - True if valid, false otherwise
 */
function validateEAN13Barcode(barcode) {
  // Check if it's 13 digits
  if (!/^\d{13}$/.test(barcode)) {
    return false;
  }

  // Verify check digit
  const barcodeWithoutCheck = barcode.slice(0, 12);
  const providedCheckDigit = parseInt(barcode[12], 10);
  const calculatedCheckDigit = parseInt(
    calculateEAN13CheckDigit(barcodeWithoutCheck),
    10
  );

  return providedCheckDigit === calculatedCheckDigit;
}

module.exports = {
  generateEAN13Barcode,
  generateSequentialBarcode,
  validateEAN13Barcode,
};
