/**
 * Verifies that the authenticated Github user matches the provided Github handle.
 *
 * @param {string} githubHandle - The Github handle to be verified.
 * @param {string} token - Github access token to be used for authenticated requests.
 * @throws {Error} If the authenticated Github user doesn't match the provided Github handle.
 */

import request from "./request";

const usernameTokenCheck = async (githubHandle, token) => {
  const { data } = await request("/user", token);
  if (data.login !== githubHandle) {
    throw new Error(
      "If you want to include private repositories, please ensure that the Github handle is associated with the provided access token."
    );
  }
};

export default usernameTokenCheck;
