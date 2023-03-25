import headerLinkParser from "./utils/headerLinkParser";

const closestUserInference = async (
  githubHandle,
  token,
  originalRepo,
  contribution,
  activity,
  closest_user_n,
  messageCommit,
  messageIssue,
  messagePR,
  messageRepo
) => {
  let responseContrib, linksContrib, remainingRateContrib, messageContrib;
  let dataContrib = [];

  if (token) {
    // Get all contributors from each repository
    for (let r of originalRepo) {
      do {
        responseContrib = await fetch(
          linksContrib && linksContrib.next
            ? linksContrib.next
            : r.contributors_url,
          {
            method: "GET",
            headers: {
              Authorization: `token ${token}`,
            },
          }
        );

        const data = await responseContrib.json();

        if (responseContrib.status === 403) {
          throw new Error(
            "API rate limit exceeded, please wait an hour before you try again."
          );
        } else {
          dataContrib.push(...data);
        }

        linksContrib =
          responseContrib.headers.get("Link") &&
          headerLinkParser(responseContrib.headers.get("Link"));

        remainingRateContrib = +responseContrib.headers.get(
          "X-RateLimit-Remaining"
        );
      } while (linksContrib?.next && remainingRateContrib > 0);
    }
  } else {
    // Get all contributors from each repository
    for (let r of originalRepo) {
      do {
        responseContrib = await fetch(
          linksContrib && linksContrib.next
            ? linksContrib.next
            : r.contributors_url
        );

        const data = await responseContrib.json();

        if (responseContrib.status === 403) {
          throw new Error(
            "API rate limit exceeded, please wait a few minutes before you try again."
          );
        } else {
          dataContrib.push(...data);
        }

        linksContrib =
          responseContrib.headers.get("Link") &&
          headerLinkParser(responseContrib.headers.get("Link"));

        remainingRateContrib = +responseContrib.headers.get(
          "X-RateLimit-Remaining"
        );
      } while (linksContrib?.next && remainingRateContrib > 0);
    }
  }

  if (remainingRateContrib === 0 && linksContrib?.next) {
    messageContrib = `Hey there! Looks like the incoming contributions above are from the latest ${dataContrib.length} repositories since you've reached the API rate limit 😉`;
  }

  let incomingContribution = dataContrib.reduce((result, d) => {
    if (d.login !== githubHandle) {
      result[d.login] = (result[d.login] || 0) + d.contributions;
    }
    return result;
  }, {});

  const usersCount = Object.keys(
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

  const totalUsersCount = Object.keys(incomingContribution).reduce(
    (result, c) => {
      result[c] = (result[c] || 0) + incomingContribution[c];
      return result;
    },
    usersCount
  );

  const sortedUsersCount = Object.fromEntries(
    Object.entries(totalUsersCount).sort(([, a], [, b]) => b - a)
  );

  delete sortedUsersCount[githubHandle];

  const closestUser = {
    closest_users: Object.keys(sortedUsersCount).slice(0, closest_user_n),
    collaboration_count: sortedUsersCount,
    commit_api_message: messageCommit ? messageCommit : "",
    issue_api_message: messageIssue ? messageIssue : "",
    pr_api_message: messagePR ? messagePR : "",
    repo_api_message: messageRepo ? messageRepo : "",
    incoming_contribution_api_message: messageContrib ? messageContrib : "",
  };

  return { closestUser };
};

export default closestUserInference;
