/**
 * Infers data regarding the user's Github repositories.
 *
 * @param {string} githubHandle - The Github handle of the user.
 * @param {string} [token=null] - Github access token to increase API rate limit and access private repositories. Default is null.
 * @param {boolean} [include_private=false] - Flag to include private repositories in the statistics. Default is false.
 * @param {number} [top_repo_n=3] - The number of top repositories to consider in the statistics. Default is 3.
 *
 * @returns {Promise<Object>} A Promise that resolves with an object containing information about the user's repositories.
 *
 * @property {Object} stats
 * * @property {boolean} incomplete_repo_results - Indicates if the results for repositories are incomplete due to reaching the API rate limit.
 * * @property {number} inference_from_repo_count - The number of repositories got from the API (before reaching the API rate limit).
 * * @property {number} original_repo_count - The number of owned repositories.
 * * @property {number} forked_repo_count - The number of forked repositories.
 * * @property {number} stargazers_count - The number of stars received in the owned repositories.
 * * @property {number} forks_count - The number of forks in the owned repositories.
 * * @property {Array.<Object>} top_repo_stars_forks - The top n repositories based on the number of stars and forks received.
 *
 * @property {Array.<Object>} originalRepo - An array of the user's owned repositories.
 * @property {Array.<Object>} repos - An array of all the user's repositories (owned and forked).
 */

import multipageRequest from "./utils/multipageRequest";
import usernameTokenCheck from "./utils/usernameTokenCheck";

export const fetchRepo = async (
  githubHandle,
  token = null,
  include_private = false
) => {
  let repoURL;

  if (include_private) {
    usernameTokenCheck(githubHandle, token);
    repoURL = `/user/repos?per_page=100`;
  } else {
    repoURL = `/users/${githubHandle}/repos?per_page=100`;
  }

  // get the current user's repositories and sort it based on the total number of stars and forks
  const { dataList: repos, incompleteResults } = await multipageRequest(
    repoURL,
    token
  );

  repos.sort(
    (a, b) =>
      b.stargazers_count + b.forks_count - (a.stargazers_count + a.forks_count)
  );

  // separate original and forked repositories
  const originalRepo = [];
  const forkedRepo = [];
  for (const repo of repos) {
    if (repo.fork === false && repo.owner.login === githubHandle) {
      originalRepo.push(repo);
    } else if (repo.fork === true && repo.owner.login === githubHandle) {
      forkedRepo.push(repo);
    }
  }

  return { repos, originalRepo, forkedRepo, incompleteResults };
};

const repositoryInference = async (
  githubHandle,
  token = null,
  include_private = false,
  top_repo_n = 3
) => {
  // fetch the current user's repositories data
  const { repos, originalRepo, forkedRepo, incompleteResults } =
    await fetchRepo(githubHandle, token, include_private);

  // count the total number of stars and forks from the original repositories
  const counts = originalRepo.reduce(
    (result, r) => {
      result.stargazers_count += r.stargazers_count;
      result.forks_count += r.forks_count;
      return result;
    },
    { stargazers_count: 0, forks_count: 0 }
  );

  // find top n repositories based on the total number of stars and forks
  const popularRepo = originalRepo.slice(0, top_repo_n).map((repo) => ({
    name: repo.name,
    html_url: repo.html_url,
    description: repo.description,
    top_language: repo.language,
    stargazers_count: repo.stargazers_count,
    forks_count: repo.forks_count,
  }));

  const stats = {
    incomplete_repo_results: incompleteResults,
    inference_from_repo_count: repos.length,
    original_repo_count: originalRepo.length,
    forked_repo_count: forkedRepo.length,
    ...counts,
    top_repo_stars_forks: popularRepo,
  };

  return { stats, originalRepo, repos };
};

export default repositoryInference;
