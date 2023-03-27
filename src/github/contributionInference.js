/**
 * Infers a user's contributions (issue + PR) to repositories on GitHub.
 *
 * @param {string} githubHandle - The Github handle of the user.
 * @param {Object} originalRepo - Original repository data (from `repositoryInference()`).
 * @param {string} [token=null] - Github access token to increase API rate limit and access private repositories. Default is null.
 * @param {boolean} [include_private=false] - Flag to include private repositories in the statistics. Default is false.
 *
 * @returns {Promise<Object>} A Promise that resolves with an object containing information about the user's contribution.
 * @property {boolean} incomplete_issue_results - Indicates if the results for issues are incomplete due to reaching the API rate limit.
 * @property {boolean} incomplete_pr_results - Indicates if the results for PR are incomplete due to reaching the API rate limit.
 * @property {number} inference_from_issue_count - The number of issues got from the search results (before reaching the API rate limit).
 * @property {number} inference_from_pr_count - The number of PR got from the search results (before reaching the API rate limit).
 * @property {number} merged_pr_count - The number of PR to other repo that have been merged.
 * @property {Object.<string, number>} self_contribution_to_external - Containing the user's contribution count (issue + PR) per repository owner.
 * @property {Object.<string, number>} external_contribution_to_self - Containing each other users' contribution count (commit + PR) to the current user's top and latest 10 repositories.
 */

import multipageRequest from "./utils/multipageRequest";
import usernameTokenCheck from "./utils/usernameTokenCheck";

const contributionInference = async (
  githubHandle,
  originalRepo,
  token = null,
  include_private = false
) => {
  if (include_private) {
    usernameTokenCheck(githubHandle, token);
  }

  // get all issues and PR from the current user
  const urlPattern = (type) =>
    `/search/issues?q=type:${type}+author:${githubHandle}${
      include_private ? "" : "+is:public"
    }&sort=author-date&order=desc&per_page=100`;
  const issueURL = urlPattern("issue");
  const prURL = urlPattern("pr");

  const { dataList: dataIssue, incompleteResults: incompleteIssueResults } =
    await multipageRequest(issueURL, token);
  const { dataList: dataPR, incompleteResults: incompletePRResults } =
    await multipageRequest(prURL, token);

  // extract the useful information from issues and PR data
  const extractRepoOwner = (item) => {
    const splitURL = item.html_url.split("/");
    return {
      repo_owner: splitURL[3],
    };
  };

  const extractPRInfo = (item) => ({
    merged_at: item.pull_request.merged_at,
    ...extractRepoOwner(item),
  });

  const issues = dataIssue
    .filter((i) => i.author_association !== "OWNER")
    .map(extractRepoOwner);
  const pr = dataPR
    .filter((p) => p.author_association !== "OWNER")
    .map(extractPRInfo);

  // count the number of PR to other repo that have been merged
  const mergedPRCount = pr.filter((p) => p.merged_at).length;

  // count and sort number of the current user's contribution (issues + PR) per each repo owner
  const contributionCount = [...issues, ...pr].reduce((result, item) => {
    result[item.repo_owner] = (result[item.repo_owner] || 0) + 1;
    return result;
  }, {});
  const sortedContributionCount = Object.fromEntries(
    Object.entries(contributionCount).sort(([, a], [, b]) => b - a)
  );

  // incoming contribution
  const dataContrib = [];

  // get all contributors from the top 10 repositories
  for (let r of originalRepo.slice(0, 10)) {
    const { dataList: data } = await multipageRequest(
      r.contributors_url,
      token
    );
    dataContrib.push(...data);
  }

  // count and sort the incoming contributions from each user
  const incomingContribution = dataContrib.reduce((result, d) => {
    if (d.login !== githubHandle) {
      result[d.login] = (result[d.login] || 0) + d.contributions;
    }
    return result;
  }, {});
  const sortedIncomingContribution = Object.fromEntries(
    Object.entries(incomingContribution).sort(([, a], [, b]) => b - a)
  );

  const contribution = {
    incomplete_issue_results: incompleteIssueResults,
    incomplete_pr_results: incompletePRResults,
    inference_from_issue_count: dataIssue.length,
    inference_from_pr_count: dataPR.length,
    merged_pr_count: mergedPRCount,
    self_contribution_to_external: sortedContributionCount,
    external_contribution_to_self: sortedIncomingContribution,
  };

  return contribution;
};

export default contributionInference;
