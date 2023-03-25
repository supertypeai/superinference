/**
 * Infers data regarding the user's Github repositories.
 *
 * @param {string} githubHandle - The Github handle of the user.
 * @param {string|null} token - Github access token to increase API rate limit and access private repositories. Default is null.
 * @param {boolean} include_private - Flag to include private repositories in the statistics. Default is false.
 * @param {number} top_repo_n - The number of top repositories to consider in the statistics. Default is 3.
 * @returns {Promise<object>} A Promise that resolves with an object containing the inferred statistics and the repositories.
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

  const { dataList, incompleteResults } = await multipageRequest(
    repoURL,
    token
  );

  dataList.sort(
    (a, b) =>
      b.stargazers_count + b.forks_count - (a.stargazers_count + a.forks_count)
  );

  const originalRepo = [];
  const forkedRepo = [];

  for (const repo of dataList) {
    if (repo.fork === false && repo.owner.login === githubHandle) {
      originalRepo.push(repo);
    } else if (repo.fork === true && repo.owner.login === githubHandle) {
      forkedRepo.push(repo);
    }
  }

  return { repos: dataList, originalRepo, forkedRepo, incompleteResults };
};

const repositoryInference = async (
  githubHandle,
  token = null,
  include_private = false,
  top_repo_n = 3
) => {
  const { repos, originalRepo, forkedRepo, incompleteResults } =
    await fetchRepo(githubHandle, token, include_private);

  const counts = originalRepo.reduce(
    (result, r) => {
      result.stargazers_count += r.stargazers_count;
      result.forks_count += r.forks_count;
      return result;
    },
    { stargazers_count: 0, forks_count: 0 }
  );

  const popularRepo = originalRepo.slice(0, top_repo_n).map((repo) => ({
    name: repo.name,
    html_url: repo.html_url,
    description: repo.description,
    top_language: repo.language,
    stargazers_count: repo.stargazers_count,
    forks_count: repo.forks_count,
  }));

  const stats = {
    incomplete_results: incompleteResults,
    inference_from_repo_count: repos.length,
    original_repo_count: originalRepo.length,
    forked_repo_count: forkedRepo.length,
    ...counts,
    top_repo_stars_forks: popularRepo,
  };

  return { stats, originalRepo, repos };
};

export default repositoryInference;
