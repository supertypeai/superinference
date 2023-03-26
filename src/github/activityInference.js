/**
 * Infers a user's activities (commits) on GitHub.
 *
 * @param {string} githubHandle -  The Github handle of the user.
 * @param {Array} repos - An array containing the user's repositories (from `repositoryInference()`).
 * @param {string} [token=null] - Github access token to increase API rate limit and access private repositories. Default is null.
 * @param {boolean} [include_private=false] - Flag to include private repositories in the statistics. Default is false.
 * @param {number} [top_repo_n=3] - The number of top repositories to consider in the statistics. Default is 3.
 *
 * @returns {Promise<Object>} A Promise that resolves with an object containing information about the user's activities.
 *
 * @property {Object} activity
 * * @property {number} commit_count: The total number of commits all time.
 * * @property {boolean} incomplete_commit_results: Indicates if the results for commits are incomplete due to reaching the API rate limit (exclude the commit_count).
 * * @property {number} inference_from_commit_count:  The number of commits got from the search results (before reaching the API rate limit).
 * * @property {number} weekly_average_commits: The weekly average number of commits.
 * * @property {Object.<string,Array>} commit_count_per_day: Containing the number of commits per day of the week. The value of the object is an array containing two numbers:
 * * * The first number represents the number of commits made on each day in the last 12 months.
 * * * The second number represents the total number of commits made on each day all time.
 * * @property {Object.<string,Array>} commit_count_per_month: Containing the number of commits per month. The value of the object is an array containing two numbers with the same behavior as above.
 * * @property {Object.<string,number>} commit_count_per_owned_repo: Containing the number of commits made to each owned repository.
 * * @property {Object.<string,number>} commit_count_per_other_repo: Containing the number of commits made to each repository not owned by the user.
 * * @property {Object.<string,number>} commit_count_per_repo_org_owner: Containing the number of commits made to each repository owned by an organization.
 * * @property {Object.<string,number>} commit_count_per_repo_user_owner: Containing the number of commits made to each repository owned by another user in the last year.
 *
 * @property {Array.<Object>} topNActiveRepo - An array of the user's top n active repositories based on the number of commits.
 */

import multipageRequest from "./utils/multipageRequest";
import usernameTokenCheck from "./utils/usernameTokenCheck";

const activityInference = async (
  githubHandle,
  repos,
  token = null,
  include_private = false,
  top_repo_n = 3
) => {
  if (include_private) {
    usernameTokenCheck(githubHandle, token);
  }

  // get all commits from the current user
  const commitURL = `/search/commits?q=committer:${githubHandle}${
    include_private ? "" : "+is:public"
  }&sort=committer-date&order=desc&per_page=100`;

  const {
    dataList: dataCommit,
    incompleteResults,
    totalCount,
  } = await multipageRequest(commitURL, token);

  const commits = dataCommit.map((c) => {
    return {
      created_at: new Date(c.commit.committer.date).toISOString().slice(0, 10),
      repo_owner: c.repository.owner.login,
      repo_owner_type: c.repository.owner.type,
      repo_name: c.repository.name,
    };
  });

  // count number of commits per category and sort the results
  const now = new Date();
  const oneYearAgo = now.setFullYear(now.getFullYear() - 1);
  const counts = commits.reduce(
    (result, c) => {
      const cDay = new Date(c.created_at).toString().split(" ")[0];
      const cMonth = new Date(c.created_at).toString().split(" ")[1];
      const lastTwelveMonths = new Date(c.created_at) >= oneYearAgo;

      result["day"][cDay] = result["day"][cDay] || [0, 0];
      result["day"][cDay][0] += lastTwelveMonths ? 1 : 0;
      result["day"][cDay][1] += 1;
      result["month"][cMonth] = result["month"][cMonth] || [0, 0];
      result["month"][cMonth][0] += lastTwelveMonths ? 1 : 0;
      result["month"][cMonth][1] += 1;
      if (c.repo_owner === githubHandle) {
        result["owned_repo"][c.repo_name] =
          (result["owned_repo"][c.repo_name] || 0) + 1;
      } else {
        result["other_repo"][c.repo_name] =
          (result["other_repo"][c.repo_name] || 0) + 1;
      }
      if (c.repo_owner_type === "Organization") {
        result["repo_org_owner"][c.repo_owner] =
          (result["repo_org_owner"][c.repo_owner] || 0) + 1;
      } else {
        result["repo_user_owner"][c.repo_owner] =
          (result["repo_user_owner"][c.repo_owner] || 0) + 1;
      }

      return result;
    },
    {
      day: {},
      month: {},
      owned_repo: {},
      other_repo: {},
      repo_org_owner: {},
      repo_user_owner: {},
    }
  );

  let sortedCounts = {};
  Object.keys(counts).forEach((k) => {
    if (k === "day" || k === "month") {
      sortedCounts[k] = Object.fromEntries(
        Object.entries(counts[k]).sort((a, b) => b[1][0] - a[1][0])
      );
    } else {
      sortedCounts[k] = Object.fromEntries(
        Object.entries(counts[k]).sort(([, a], [, b]) => b - a)
      );
    }
  });

  // get the top n active repositories based on total number of commits
  const topNActiveRepo = Object.keys(sortedCounts["owned_repo"])
    .slice(0, top_repo_n)
    .map((repoName) => {
      const repo = repos.find((r) => r.name === repoName);
      if (!repo) return null;

      const { name, html_url, description, language } = repo;
      return {
        name,
        html_url,
        description,
        top_language: language,
        commits_count: sortedCounts["owned_repo"][repoName],
      };
    })
    .filter((repo) => repo !== null);

  // calculate weekly average commits
  const firstCommitDate =
    commits.length > 0 ? new Date(commits[0]["created_at"]) : null;
  const lastCommitDate =
    commits.length > 0
      ? new Date(commits[commits.length - 1]["created_at"])
      : null;
  const totalWeeks =
    firstCommitDate && lastCommitDate
      ? Math.floor(
          (firstCommitDate - lastCommitDate) / (7 * 24 * 60 * 60 * 1000)
        )
      : 0;
  const weeklyAvgCommits =
    commits.length > 0 ? (commits.length / totalWeeks).toFixed(3) : 0;

  const activity = {
    commit_count: totalCount,
    incomplete_commit_results: incompleteResults,
    inference_from_commit_count: dataCommit.length,
    weekly_average_commits: weeklyAvgCommits,
    commit_count_per_day: sortedCounts["day"],
    commit_count_per_month: sortedCounts["month"],
    commit_count_per_owned_repo: sortedCounts["owned_repo"],
    commit_count_per_other_repo: sortedCounts["other_repo"],
    commit_count_per_repo_org_owner: sortedCounts["repo_org_owner"],
    commit_count_per_repo_user_owner: sortedCounts["repo_user_owner"],
  };

  return { activity, topNActiveRepo };
};

export default activityInference;
