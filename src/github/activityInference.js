/**
 * Infers a user's activities (commits) on GitHub.
 *
 * @param {string} githubHandle -  The Github handle of the user.
 * @param {Array} repos - An array containing the user's repositories (from `repositoryInference()`).
 * @param {string} [token=null] - Github access token to increase API rate limit and access private repositories. Default is null.
 * @param {boolean} [include_private=false] - Flag to include private repositories in the statistics. Default is false.
 *
 * @returns {Promise<Object>} A Promise that resolves with an object containing information about the user's activities.
 * @property {number} commit_count: The total number of commits all time.
 * @property {boolean} incomplete_commit_results: Indicates if the results for commits are incomplete due to reaching the API rate limit (exclude the commit_count).
 * @property {number} inference_from_commit_count:  The number of commits got from the search results (before reaching the API rate limit).
 * @property {number} weekly_average_commits: The weekly average number of commits.
 * @property {Object.<string,Array>} commit_count_per_day: Containing the number of commits per day of the week. The value of the object is an array containing two numbers:
 * * The first number represents the number of commits made on each day in the last 12 months.
 * * The second number represents the total number of commits made on each day all time.
 * @property {Object.<string,Array>} commit_count_per_month: Containing the number of commits per month. The value of the object is an array containing two numbers with the same behavior as above.
 * @property {Object.<string,number>} commit_count_per_owned_repo: Containing the number of commits made to each owned repository.
 * @property {Array.<Object>} commit_count_per_other_repo: Containing the number of commits made to each repository not owned by the user and the repository details.
 * @property {Object.<string,number>} commit_count_per_repo_org_owner: Containing the number of commits made to each repository owned by an organization.
 * @property {Object.<string,number>} commit_count_per_repo_user_owner: Containing the number of commits made to each repository owned by another user in the last year.
 */

import multipageRequest from "./utils/multipageRequest";
import usernameTokenCheck from "./utils/usernameTokenCheck";

const activityInference = async (
  githubHandle,
  token = null,
  include_private = false
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
      name: c.repository.name,
      html_url: c.repository.html_url,
      description: c.repository.description,
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
      const repoType =
        c.repo_owner === githubHandle ? "owned_repo" : "other_repo";
      result[repoType][c.name] = (result[repoType][c.name] || 0) + 1;
      const ownerType =
        c.repo_owner_type === "Organization"
          ? "repo_org_owner"
          : "repo_user_owner";
      result[ownerType][c.repo_owner] =
        (result[ownerType][c.repo_owner] || 0) + 1;

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

  // expand commit count to other repo
  const otherRepoCommits = commits
    .filter((c) => c.repo_owner !== githubHandle)
    .reduce((result, c) => {
      const hasDuplicate = result.some((obj) => obj.name === c.name);
      if (!hasDuplicate) {
        result.push({
          name: c.name,
          owner: c.repo_owner,
          html_url: c.html_url,
          description: c.description,
          commits_count: sortedCounts["other_repo"][c.name],
        });
      }
      return result;
    }, [])
    .sort((a, b) => b.commits_count - a.commits_count);

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
    commit_count_per_other_repo: otherRepoCommits,
    commit_count_per_repo_org_owner: sortedCounts["repo_org_owner"],
    commit_count_per_repo_user_owner: sortedCounts["repo_user_owner"],
  };

  return activity;
};

export default activityInference;
