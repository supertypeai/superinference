/**
 * Performs inference on a Dev.to profile
 * @param {Object} options - An object that contains the following:
 * * @param {string} devtoHandle - The Dev.to handle of the user.
 *
 * @returns {Promise<Object>} A Promise that resolves with an object containing inference of the user's profile.
 * @throws {Error} If an invalid Dev.to handle is inputted.
 */

import endpoints from "../endpoints.json";

const devtoAPIRoot = endpoints["devto"];

const inferFromDevto = async ({ devtoHandle } = {}) => {
  const response = await fetch(
    `${devtoAPIRoot}/users/by_username?url=${devtoHandle}`
  );

  const data = await response.json();

  if (data.error && data.error === "Not Found") {
    throw new Error("Invalid Dev.to handle inputted.");
  } else {
    return data;
  }
};

export default inferFromDevto;
