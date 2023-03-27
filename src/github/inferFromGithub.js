/**
 * Performs inference on a Github profile
 *
 * @param {Object} options - An object that can contain the following:
 * * @param {string} githubHandle - The Github handle of the user.
 * * @param {string} [token=null] - Github access token to increase API rate limit and access private repositories. Default is null.
 * * @param {boolean} [include_private=false] - Flag to include private repositories in the statistics. Default is false.
 * * @param {number} [top_repo_n=3] - The number of top repositories to consider in the statistics. Default is 3.
 * * @param {number} [top_language_n=3] - Number of top languages to be included in the inference. Default is 3.
 *
 * @returns {Promise<Object>} A Promise that resolves with an object contains the following:
 * * @property {Object} profile - An object that contains the inferred profile data of the user.
 * * @property {Object} skill - An object that contains the inferred skill data of the user.
 * * @property {Object} stats - An object that contains the inferred repositories data of the user.
 * * @property {Object} activity - An object that contains the inferred activity (commit) data of the user.
 * * @property {Object} contribution - An object that contains the inferred contribution (issues and PR) data of the user.
 */

import activityInference from "./activityInference";
import contributionInference from "./contributionInference";
import profileInference from "./profileInference";
import repositoryInference from "./repositoryInference";
import skillInference from "./skillInference";

const inferFromGithub = async ({
  githubHandle,
  token = null,
  include_private = false,
  top_repo_n = 3,
  top_language_n = 3,
} = {}) => {
  const profile = await profileInference(githubHandle, token);

  let { stats, originalRepo, repos } = await repositoryInference(
    githubHandle,
    token,
    include_private,
    top_repo_n
  );

  const skill = await skillInference(
    githubHandle,
    profile.bio,
    originalRepo,
    token,
    top_language_n,
    include_private
  );

  const contribution = await contributionInference(
    githubHandle,
    originalRepo,
    token,
    include_private
  );

  const activity = await activityInference(
    githubHandle,
    token,
    include_private
  );

  return {
    profile,
    skill,
    stats,
    activity,
    contribution,
  };
};

export default inferFromGithub;
