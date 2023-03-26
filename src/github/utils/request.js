/**
 * Makes a request to a specified Github API URL and returns a parsed JSON response.
 *
 * @param {string} url - The URL to send the request to.
 * @param {string} [token=null] - Github access token to increase API rate limit and access private repositories. Default is null.
 *
 * @returns {Promise<Object>} A Promise that resolves with an object containing the response and the requested data.
 * @property {Object} response - The HTTP response object.
 * @property {Object} data - A parsed JSON response data if the response status is 200.
 *
 * @throws {Error} If there is an error during the request or the response contains an error.
 */

import errorHandling from "./errorHandling";
import endpoints from "../../endpoints.json";

const request = async (url, token = null) => {
  const githubLink = endpoints["github"];
  if (!url.startsWith(githubLink)) {
    url = githubLink + url;
  }

  const headers = {};
  if (token) {
    headers["Authorization"] = `token ${token}`;
  }

  const response = await fetch(url, { headers });

  const data = await errorHandling(response, token);

  return { response, data };
};

export default request;
