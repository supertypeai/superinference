import endpoints from "../endpoints.json";
import headerLinkParser from "./utils/headerLinkParser";

const githubLink = endpoints["github"];

const activityInference = async (
  githubHandle,
  repos,
  token = null,
  include_private,
  top_repo_n = 3
) => {
  let responseCommit, linksCommit, data, remainingRate, messageCommit;
  let dataCommit = [];
  if (token) {
    do {
      responseCommit = await fetch(
        linksCommit && linksCommit.next
          ? linksCommit.next
          : `${githubLink}/search/commits?q=committer:${githubHandle}${
              include_private ? "" : " is:public"
            }&sort=committer-date&order=desc&per_page=100`,
        {
          method: "GET",
          headers: {
            Authorization: `token ${token}`,
          },
        }
      );

      data = await responseCommit.json();

      if (data.message && data.message === "Validation Failed") {
        throw new Error("Invalid GitHub handle inputted.");
      } else if (responseCommit.status === 403) {
        throw new Error(
          "API rate limit exceeded, please wait a few minutes before you try again."
        );
      } else {
        dataCommit.push(...data.items);
      }

      linksCommit =
        responseCommit.headers.get("Link") &&
        headerLinkParser(responseCommit.headers.get("Link"));

      remainingRate = +responseCommit.headers.get("X-Ratelimit-Remaining");
    } while (linksCommit?.next && remainingRate > 0);
  } else {
    do {
      responseCommit = await fetch(
        linksCommit && linksCommit.next
          ? linksCommit.next
          : `${githubLink}/search/commits?q=committer:${githubHandle}&sort=committer-date&order=desc&per_page=100`
      );

      data = await responseCommit.json();

      if (data.message && data.message === "Validation Failed") {
        throw new Error("Invalid GitHub handle inputted.");
      } else if (responseCommit.status === 403) {
        throw new Error(
          "API rate limit exceeded, please use an authenticated request."
        );
      } else {
        dataCommit.push(...data.items);
      }

      linksCommit =
        responseCommit.headers.get("Link") &&
        headerLinkParser(responseCommit.headers.get("Link"));

      remainingRate = +responseCommit.headers.get("X-Ratelimit-Remaining");
    } while (linksCommit?.next && remainingRate > 0);
  }

  if (remainingRate === 0 && linksCommit?.next) {
    messageCommit = `Hey there! Looks like the inference above (except the commit_count) is from the latest ${dataCommit.length} commits since you've reached the API rate limit 😉`;
  }

  let commits = dataCommit.map((c) => {
    return {
      created_at: new Date(c.commit.committer.date).toISOString().slice(0, 10),
      repo_owner: c.repository.owner.login,
      repo_owner_type: c.repository.owner.type,
      repo_name: c.repository.name,
    };
  });

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

  let mostActiveRepo = Object.keys(sortedCounts["owned_repo"]).slice(
    0,
    top_repo_n
  );
  mostActiveRepo = mostActiveRepo.map((repoName) => {
    const repo = repos.find((r) => r.name === repoName);
    if (repo) {
      const { name, html_url, description, language } = repo;
      return {
        name,
        html_url,
        description,
        top_language: language,
        commits_count: sortedCounts["owned_repo"][repoName],
      };
    }
  });

  const totalWeeks =
    commits.length > 0
      ? Math.floor(
          (new Date(commits[0]["created_at"]) -
            new Date(commits[commits.length - 1]["created_at"])) /
            (7 * 24 * 60 * 60 * 1000)
        )
      : 0;
  const weeklyAvgCommits =
    commits.length > 0 ? (commits.length / totalWeeks).toFixed(3) : 0;

  const activity = {
    commit_count: data.total_count,
    weekly_average_commits: weeklyAvgCommits,
    commit_count_per_day: sortedCounts["day"],
    commit_count_per_month: sortedCounts["month"],
    commit_count_per_owned_repo: sortedCounts["owned_repo"],
    commit_count_per_other_repo: sortedCounts["other_repo"],
    commit_count_per_repo_org_owner: sortedCounts["repo_org_owner"],
    commit_count_per_repo_user_owner: sortedCounts["repo_user_owner"],
    commit_api_message: messageCommit ? messageCommit : "",
  };

  return { activity, mostActiveRepo, messageCommit };
};

export default activityInference;
