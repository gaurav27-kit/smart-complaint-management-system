/**
 * @file testDataFactory.js
 * @description Centralized data factory for generating realistic test request payloads.
 */

/**
 * Generate a valid registration payload for POST /api/auth/register
 * @param {Object} overrides - Payload overrides
 * @returns {Object} Registration payload
 */
export const buildRegisterPayload = (overrides = {}) => {
  const uniqueId = Math.random().toString(36).substring(2, 9);
  return {
    fullName: "John Doe",
    email: `johndoe_${uniqueId}@example.com`,
    password: "Password123!",
    ...overrides,
  };
};

/**
 * Generate a valid login payload for POST /api/auth/login
 * @param {Object} overrides - Payload overrides
 * @returns {Object} Login payload
 */
export const buildLoginPayload = (overrides = {}) => ({
  email: "john@example.com",
  password: "Password123!",
  ...overrides,
});

/**
 * Generate a valid complaint creation payload for POST /api/complaints
 * @param {Object} overrides - Payload overrides
 * @returns {Object} Complaint creation payload
 */
export const buildComplaintPayload = (overrides = {}) => ({
  title: "Broken Streetlamp on 5th Avenue",
  description: "The streetlamp has been flickering and completely dark for 3 days.",
  category: "Road",
  location: "5th Avenue, Corner 12",
  priority: "High",
  ...overrides,
});
