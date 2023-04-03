/**
 * Executes a GraphQL request against the GitHub API.
 *
 * @param {string} query - The GraphQL query to execute.
 * @param {string} [token=null] - Github access token to authorize request to Github API. Default is null.
 *
 * @returns {Promise} - A Promise object that resolves to the data returned by the API.
 *
 * @throws {Error} - If the API returns an error or the request fails.
 */

import errorHandling from "./errorHandling";
import endpoints from "../../endpoints.json";

const graphqlRequest = async (query, token = null) => {
  const url = `${endpoints["github"]}/graphql`;

  const headers = {};
  if (token) {
    headers["Authorization"] = `token ${token}`;
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({
      query: query,
    }),
  });

  const data = await errorHandling(response, token, (graphql = true));

  return data;
};

export default graphqlRequest;
