/**
 * Handles errors returned from a HTTP response.
 *
 * @param {object} response - The HTTP response object.
 * @param {string|null} token - The access token used for the request (default is null).
 * @returns {object} The parsed JSON response data if the response status is 200.
 * @throws {Error} If the response status is 401, 403 or other status codes that indicate an error.
 */

const errorHandling = async (response, token) => {
  if (response.status === 200) {
    return await response.json();
  } else if (response.status === 401) {
    if (token) {
      throw new Error(
        "Invalid access token. Please check your access token and try again."
      );
    } else {
      throw new Error(
        "This feature requires an access token. Please provide an access token and try again."
      );
    }
  } else if (response.status === 403) {
    if (token) {
      throw new Error("API rate limit exceeded, please try again later.");
    } else {
      throw new Error(
        "API rate limit exceeded, please provide an access token to increase rate limit."
      );
    }
  }
};

export default errorHandling;
