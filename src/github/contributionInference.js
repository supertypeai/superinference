import endpoints from "../endpoints.json";
import headerLinkParser from "./utils/headerLinkParser";

const githubLink = endpoints["github"];

const contributionInference = async (githubHandle, token, include_private) => {
  let responseIssue,
    responsePR,
    linksIssue,
    linksPR,
    remainingRateIssue,
    remainingRatePR,
    messageIssue,
    messagePR;
  let dataIssue = [];
  let dataPR = [];
  if (token) {
    do {
      responseIssue = await fetch(
        linksIssue && linksIssue.next
          ? linksIssue.next
          : `${githubLink}/search/issues?q=type:issue author:${githubHandle}${
              include_private ? "" : " is:public"
            }&sort=author-date&order=desc&per_page=100`,
        {
          method: "GET",
          headers: {
            Authorization: `token ${token}`,
          },
        }
      );

      const data = await responseIssue.json();

      if (data.message && data.message === "Validation Failed") {
        throw new Error("Invalid GitHub handle inputted.");
      } else if (responseIssue.status === 403) {
        throw new Error(
          "API rate limit exceeded, please wait a few minutes before you try again."
        );
      } else {
        dataIssue.push(...data.items);
      }

      linksIssue =
        responseIssue.headers.get("Link") &&
        headerLinkParser(responseIssue.headers.get("Link"));

      remainingRateIssue = +responseIssue.headers.get("X-Ratelimit-Remaining");
    } while (linksIssue?.next && remainingRateIssue > 0);

    do {
      responsePR = await fetch(
        linksPR && linksPR.next
          ? linksPR.next
          : `${githubLink}/search/issues?q=type:pr author:${githubHandle}${
              include_private ? "" : " is:public"
            }&sort=author-date&order=desc&per_page=100`,
        {
          method: "GET",
          headers: {
            Authorization: `token ${token}`,
          },
        }
      );

      const data = await responsePR.json();

      if (data.message && data.message === "Validation Failed") {
        throw new Error("Invalid GitHub handle inputted.");
      } else if (responsePR.status === 403) {
        throw new Error(
          "API rate limit exceeded, please wait a few minutes before you try again."
        );
      } else {
        dataPR.push(...data.items);
      }

      linksPR =
        responsePR.headers.get("Link") &&
        headerLinkParser(responsePR.headers.get("Link"));

      remainingRatePR = +responsePR.headers.get("X-Ratelimit-Remaining");
    } while (linksPR?.next && remainingRatePR > 0);
  } else {
    do {
      responseIssue = await fetch(
        linksIssue && linksIssue.next
          ? linksIssue.next
          : `${githubLink}/search/issues?q=type:issue author:${githubHandle}&sort=author-date&order=desc&per_page=100`
      );

      const data = await responseIssue.json();

      if (data.message && data.message === "Validation Failed") {
        throw new Error("Invalid GitHub handle inputted.");
      } else if (responseIssue.status === 403) {
        throw new Error(
          "API rate limit exceeded, please use an authenticated request."
        );
      } else {
        dataIssue.push(...data.items);
      }

      linksIssue =
        responseIssue.headers.get("Link") &&
        headerLinkParser(responseIssue.headers.get("Link"));

      remainingRateIssue = +responseIssue.headers.get("X-Ratelimit-Remaining");
    } while (linksIssue?.next && remainingRateIssue > 0);

    do {
      responsePR = await fetch(
        linksPR && linksPR.next
          ? linksPR.next
          : `${githubLink}/search/issues?q=type:pr author:${githubHandle}&sort=author-date&order=desc&per_page=100`
      );

      const data = await responsePR.json();

      if (data.message && data.message === "Validation Failed") {
        throw new Error("Invalid GitHub handle inputted");
      } else if (responsePR.status === 403) {
        throw new Error(
          "API rate limit exceeded, please use an authenticated request"
        );
      } else {
        dataPR.push(...data.items);
      }

      linksPR =
        responsePR.headers.get("Link") &&
        headerLinkParser(responsePR.headers.get("Link"));

      remainingRatePR = +responsePR.headers.get("X-Ratelimit-Remaining");
    } while (linksPR?.next && remainingRatePR > 0);
  }

  if (remainingRateIssue === 0 && linksIssue?.next) {
    messageIssue = `Hey there! Looks like the inference above is from the latest ${dataIssue.length} issues since you've reached the API rate limit 😉`;
  }

  if (remainingRatePR === 0 && linksPR?.next) {
    messagePR = `Hey there! Looks like the inference above is from the latest ${dataPR.length} PR since you've reached the API rate limit 😉`;
  }

  let issues = dataIssue.map((i) => {
    if (i.author_association !== "OWNER") {
      const splitURL = i.html_url.split("/");
      return {
        issue_title: i.title,
        created_at: i.created_at,
        state: i.state,
        state_reason: i.state_reason,
        repo_owner: splitURL[3],
        repo_name: splitURL[4],
        repo_url: `https://github.com/${splitURL[3]}/${splitURL[4]}`,
      };
    }
  });
  issues = issues.filter((i) => i !== undefined);

  let pr = dataPR.map((p) => {
    if (p.author_association !== "OWNER") {
      const splitURL = p.html_url.split("/");
      return {
        pr_title: p.title,
        created_at: p.created_at,
        merged_at: p.pull_request.merged_at,
        state: p.state,
        state_reason: p.state_reason,
        repo_owner: splitURL[3],
        repo_name: splitURL[4],
        repo_url: `https://github.com/${splitURL[3]}/${splitURL[4]}`,
      };
    }
  });
  pr = pr.filter((p) => p !== undefined);
  const mergedPR = pr.filter((p) => p.merged_at).length;

  let contributionCount = [...issues, ...pr].reduce((result, i) => {
    result[i.repo_owner] = (result[i.repo_owner] || 0) + 1;
    return result;
  }, {});
  contributionCount = Object.fromEntries(
    Object.entries(contributionCount).sort(([, a], [, b]) => b - a)
  );

  const contribution = {
    issue_count: issues.length,
    total_pr_count: pr.length,
    merged_pr_count: mergedPR,
    user_contribution_to_other_repo: contributionCount,
    created_issue: issues,
    created_pr: pr,
    issue_api_message: messageIssue ? messageIssue : "",
    pr_api_message: messagePR ? messagePR : "",
  };

  return { contribution, messageIssue, messagePR };
};

export default contributionInference;
