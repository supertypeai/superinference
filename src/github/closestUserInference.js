/**
 * Infers the closest users to a given GitHub user based on:
 * the number of commits, pull requests, and issues the user gave to or received from other users.
 * @param {string} githubHandle - The Github handle of the user.
 * @param {Object} originalRepo - Original repository data (from `repositoryInference()`).
 * @param {Object} contribution - Contribution inference result (from `contributionInference()`).
 * @param {Object} activity - Activity inference result (from `activityInference()`).
 * @param {string} [token=null] - Github access token to increase API rate limit and access private repositories. Default is null.
 * @param {number} [closest_user_n=3] - The number of closest users to return. Default is 3.
 *
 * @returns {Promise<Object>} A Promise that resolves with an object containing information about the user's closest users.
 * @property {Array} closest_users - The top n closest users based on the total collaboration.
 * @property {Object.<string, number>} collaboration_count - Containing the total collaboration between the current user with each other users.
 */

import multipageRequest from "./utils/multipageRequest";

const closestUserInference = async (
  githubHandle,
  originalRepo,
  contribution,
  activity,
  token = null,
  closest_user_n = 3
) => {
  const dataContrib = [];

  // get all contributors from each repository
  for (let r of originalRepo) {
    const { dataList: data } = await multipageRequest(
      r.contributors_url,
      token
    );
    dataContrib.push(...data);
  }

  // count the incoming contributions from each user
  let incomingContribution = dataContrib.reduce((result, d) => {
    if (d.login !== githubHandle) {
      result[d.login] = (result[d.login] || 0) + d.contributions;
    }
    return result;
  }, {});

  // count the total number of commits + pr + issue made by each user
  const collaborationCount = Object.keys(
    contribution.user_contribution_to_other_repo
  ).reduce(
    (result, c) => {
      result[c] =
        (result[c] || 0) + contribution.user_contribution_to_other_repo[c];
      return result;
    },
    {
      ...activity.commit_count_per_repo_user_owner,
      ...activity.commit_count_per_repo_org_owner,
    }
  );

  // add incoming contribution to complete the total collaboration count
  const totalCollaborationCount = Object.keys(incomingContribution).reduce(
    (result, c) => {
      result[c] = (result[c] || 0) + incomingContribution[c];
      return result;
    },
    collaborationCount
  );

  // sort the collaboration count in descending order
  const sortedCollaborationCount = Object.fromEntries(
    Object.entries(totalCollaborationCount).sort(([, a], [, b]) => b - a)
  );

  // remove the current user from the collaboration count
  delete sortedCollaborationCount[githubHandle];

  const closestUser = {
    closest_users: Object.keys(sortedCollaborationCount).slice(
      0,
      closest_user_n
    ),
    collaboration_count: sortedCollaborationCount,
  };

  return closestUser;
};

export default closestUserInference;
