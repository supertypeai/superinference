/**
 * Performs inference on a Github repository
 *
 * @param {Object} options - An object that can contain the following:
 * * @param {string} repositoryOwner - The Github handle of the repository owner.
 * * @param {string} repositoryName - The repository name.
 * * @param {string} [token=null] - Github access token to increase API rate limit and access private repositories. Default is null.
 *
 * @returns {Promise<Object>}  A Promise that resolves with an object containing inference of the repository.
 */

import multipageRequest from "./utils/multipageRequest.js";
import request from "./utils/request.js";

const inferFromGithubRepo = async ({
  repositoryOwner,
  repositoryName,
  token = null,
} = {}) => {
  const repoURL = `/repos/${repositoryOwner}/${repositoryName}`;
  const { data: repository } = await request(repoURL, token);

  // fetch languages data
  const { data: repositoryLanguage } = await request(
    repository.languages_url,
    token
  );

  const languageData = Object.entries(repositoryLanguage).map(
    ([language, number_of_bytes]) => ({
      [language]: parseFloat(
        (
          number_of_bytes /
          Object.values(repositoryLanguage).reduce((a, b) => a + b, 0)
        ).toFixed(3)
      ),
    })
  );

  // fetch events data
  const { dataList: repositoryEvent, incompleteResults: incompleteEvent } =
    await multipageRequest(`${repository.events_url}?per_page=100`, token);

  const countByType = repositoryEvent.reduce((result, event) => {
    result[event.type] = (result[event.type] || 0) + 1;
    return result;
  }, {});

  // fetch contributions data
  const {
    dataList: repositoryContributors,
    incompleteResults: incompleteContributor,
  } = await multipageRequest(
    `${repository.contributors_url}?per_page=100`,
    token
  );

  const totalContributions = repositoryContributors.reduce(
    (result, contributor) => result + contributor.contributions,
    0
  );
  const totalContributors = repositoryContributors.length;

  const contributionsData = repositoryContributors.map((user) => ({
    contributor_username: user.login,
    contributor_html_url: user.html_url,
    contributor_repos_url: user.repos_url,
    contributor_type: user.type,
    contributions: user.contributions,
    contributions_percentage: parseFloat(
      (user.contributions / totalContributions).toFixed(3)
    ),
  }));

  return {
    name: repository.name,
    html_url: repository.html_url,
    description: repository.description,
    owner_username: repository.owner.login,
    owner_html_url: repository.owner.html_url,
    topic: repository.topics,
    visibility: repository.visibility,
    created_at: repository.created_at,
    last_pushed_at: repository.pushed_at,
    top_language: repository.language,
    languages_percentage: languageData,
    stargazers_count: repository.stargazers_count,
    forks_count: repository.forks_count,
    watchers_count: repository.watchers_count,
    subscribers_count: repository.subscribers_count,
    open_issues_count: repository.open_issues_count,
    incomplete_contribution_results: incompleteContributor,
    contributors_count: totalContributors,
    contributions_count: totalContributions,
    contributions: contributionsData,
    incomplete_event_results: incompleteEvent,
    events_count: countByType,
  };
};

export default inferFromGithubRepo;
