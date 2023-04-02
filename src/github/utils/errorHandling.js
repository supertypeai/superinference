/**
 * Handles errors returned from a HTTP response.
 *
 * @param {Object} response - The HTTP response object.
 * @param {string} [token=null] - The access token used for the request. Default is null.
 *
 * @returns {Promise<Object>} A Promise that resolves with a parsed JSON response data if the response status is 200.
 *
 * @throws {Error} If the response status is 401, 403 or other status codes that indicate an error.
 */

const errorHandling = async (response, token, graphql = false) => {
  if (response.status === 200) {
    if (graphql) {
      const parsedResponse = await response.json();
      if (parsedResponse.errors && parsedResponse.errors[0]["message"]) {
        throw new Error(
          `GraphQL API query error - "${parsedResponse.errors[0]["message"]}"`
        );
      } else {
        const { data } = parsedResponse;
        return data;
      }
    } else {
      return await response.json();
    }
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
