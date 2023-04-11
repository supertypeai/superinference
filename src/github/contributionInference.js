/**
 * Infers a user's contributions to repositories on GitHub.
 *
 * @param {string} githubHandle - The Github handle of the user.
 * @param {string} token - Github access token to increase API rate limit and access private repositories.
 * @param {string} createdProfileDate - The user's Github profile creation date (from `profileInference()`).
 * @param {Object} originalRepo - Original repository data (from `repositoryInference()`).
 * @param {boolean} [include_private=false] - Flag to include private repositories in the statistics. Default is false.
 *
 * @returns {Promise<Object>} A Promise that resolves with an object containing information about the user's contribution.
 * @property {number} contribution_count: The total number of contributions all time.
 * @property {number} weekly_average_contribution: The weekly average number of contributions.
 * @property {Object.<string,Array>} contribution_count_per_day: Containing the number of contributions per day of the week. The value of the object is an array containing two numbers:
 * * The first number represents the number of contributions made on each day in the last 12 months.
 * * The second number represents the total number of contributions made on each day all time.
 * @property {Object.<string,Array>} contribution_count_per_month: Containing the number of contributions per month. The value of the object is an array containing two numbers with the same behavior as above.
 * The following properties (except the external_contribution_to_top_10_repo) are inferred from the top 100 repos per year based on the total contributions count:
 * @property {Object.<string,number>} contribution_count_per_owned_repo: Containing the number of contributions made to each owned repository.
 * @property {Array.<Object>} contribution_count_per_other_repo: Containing the number of contributions made to each repository not owned by the user and the repository details.
 * @property {Object.<string,number>} contribution_count_per_repo_org_owner: Containing the number of contributions made to each repository owned by an organization.
 * @property {Object.<string,number>} contribution_count_per_repo_user_owner: Containing the number of contributions made to each repository owned by another user.
 * @property {Object.<string, number>} external_contribution_to_top_10_repo - Containing each other users' contribution count to the current user's top and latest 10 repositories.
 */

import graphqlRequest from "./utils/graphqlRequest";
import multipageRequest from "./utils/multipageRequest";

const contributionInference = async (
  githubHandle,
  token,
  createdProfileDate,
  originalRepo,
  include_private = false
) => {
  // return null if no token is provided
  if (!token) {
    return null;
  }

  // get full year of createdProfileDate & today
  const createdYear = new Date(createdProfileDate).getFullYear();
  const today = new Date();
  const currentYear = today.getFullYear();

  // get contributions per day and per repo from the API
  const queryPatternDay = (githubHandle, startDate, endDate) => {
    return `query {
        user(login: "${githubHandle}") {
          contributionsCollection(from: "${new Date(
            startDate
          ).toISOString()}", to: "${new Date(endDate).toISOString()}") {
            contributionCalendar {
              totalContributions
              weeks {
                contributionDays {
                  date
                  contributionCount
                }
              }
            }
          }
        }
      }`;
  };

  const contributionDetail = `repository {
    description
    name
    url
    languages(first: 1, orderBy: {field: SIZE, direction: DESC}) {
        nodes {
            name
        }
    }
    owner {
        __typename
        ... on User {
        login
        }
        ... on Organization {
        login
        }
    }
    isPrivate
  } contributions {
    totalCount
  }`;
  const queryPatternRepo = (githubHandle, startDate, endDate) => {
    return `query {
        user(login: "${githubHandle}") {
          contributionsCollection(from: "${new Date(
            startDate
          ).toISOString()}", to: "${new Date(endDate).toISOString()}") {
            commitContributionsByRepository(maxRepositories: 100) {
              ${contributionDetail}    
            }
            issueContributionsByRepository(maxRepositories: 100) {
              ${contributionDetail}
            }
            pullRequestContributionsByRepository(maxRepositories: 100) {
              ${contributionDetail}
            }
            pullRequestReviewContributionsByRepository(maxRepositories: 100) {
              ${contributionDetail}
            }
          }
        }
      }`;
  };

  let contributionsPerDay = [];
  let contributionsPerRepo = [];
  let contributionsCount = 0;
  for (let i = createdYear; i <= currentYear; i++) {
    let queryDay, queryRepo;
    if (i === createdYear) {
      queryDay = queryPatternDay(
        githubHandle,
        createdProfileDate,
        `${i}-12-31`
      );
      queryRepo = queryPatternRepo(
        githubHandle,
        createdProfileDate,
        `${i}-12-31`
      );
    } else if (i === currentYear) {
      queryDay = queryPatternDay(githubHandle, `${i}-01-01`, today);
      queryRepo = queryPatternRepo(githubHandle, `${i}-01-01`, today);
    } else {
      queryDay = queryPatternDay(githubHandle, `${i}-01-01`, `${i}-12-31`);
      queryRepo = queryPatternRepo(githubHandle, `${i}-01-01`, `${i}-12-31`);
    }

    const dataDay = await graphqlRequest(queryDay, token);
    const newContributionDay =
      dataDay.user.contributionsCollection.contributionCalendar.weeks
        .map((item) => item.contributionDays)
        .reduce((acc, cur) => acc.concat(cur), []);
    contributionsPerDay = contributionsPerDay.concat(newContributionDay);
    contributionsCount +=
      dataDay.user.contributionsCollection.contributionCalendar
        .totalContributions;

    const dataRepo = await graphqlRequest(queryRepo, token);
    const extractRepoDetail = (repository, contributions) => {
      return {
        name: repository.name,
        owner: repository.owner.login,
        owner_type: repository.owner["__typename"],
        html_url: repository.url,
        description: repository.description,
        top_language: repository.languages.nodes[0]
          ? repository.languages.nodes[0].name.toLowerCase().replace(/ /g, "-")
          : null,
        contributions_count: contributions.totalCount,
        is_private: repository.isPrivate,
      };
    };
    const newCommits =
      dataRepo.user.contributionsCollection.commitContributionsByRepository.map(
        ({ repository, contributions }) => {
          return extractRepoDetail(repository, contributions);
        }
      );
    const newIssues =
      dataRepo.user.contributionsCollection.issueContributionsByRepository.map(
        ({ repository, contributions }) => {
          return extractRepoDetail(repository, contributions);
        }
      );
    const newPR =
      dataRepo.user.contributionsCollection.pullRequestContributionsByRepository.map(
        ({ repository, contributions }) => {
          return extractRepoDetail(repository, contributions);
        }
      );
    const newPRReview =
      dataRepo.user.contributionsCollection.pullRequestReviewContributionsByRepository.map(
        ({ repository, contributions }) => {
          return extractRepoDetail(repository, contributions);
        }
      );
    contributionsPerRepo = contributionsPerRepo.concat([
      ...newCommits,
      ...newIssues,
      ...newPR,
      ...newPRReview,
    ]);
  }

  if (!include_private) {
    contributionsPerRepo = contributionsPerRepo.filter(
      (c) => c.is_private === false
    );
  }

  // count number of contributions per day and month
  const oneYearAgo = new Date().setFullYear(new Date().getFullYear() - 1);
  const count = contributionsPerDay.reduce(
    (result, c) => {
      const cDay = new Date(c.date).toString().split(" ")[0];
      const cMonth = new Date(c.date).toString().split(" ")[1];
      const lastTwelveMonths = new Date(c.date) >= oneYearAgo;

      result["day"][cDay] = result["day"][cDay] || [0, 0];
      result["day"][cDay][0] += lastTwelveMonths ? c.contributionCount : 0;
      result["day"][cDay][1] += c.contributionCount;
      result["month"][cMonth] = result["month"][cMonth] || [0, 0];
      result["month"][cMonth][0] += lastTwelveMonths ? c.contributionCount : 0;
      result["month"][cMonth][1] += c.contributionCount;
      return result;
    },
    {
      day: {},
      month: {},
    }
  );

  // count number of contributions per repo and repo owner
  const finalCount = contributionsPerRepo.reduce(
    (result, c) => {
      const repoType = c.owner === githubHandle ? "owned_repo" : "other_repo";

      if (repoType === "owned_repo") {
        result[repoType][c.name] =
          (result[repoType][c.name] || 0) + c.contributions_count;
      } else {
        const index = result[repoType].findIndex(
          (obj) => obj.html_url === c.html_url
        );

        if (index === -1) {
          const { owner_type, is_private, ...data } = c;
          result[repoType].push(data);
        } else {
          result[repoType][index] = {
            ...result[repoType][index],
            contributions_count:
              result[repoType][index].contributions_count +
              c.contributions_count,
          };
        }
      }

      result[c.owner_type][c.owner] =
        (result[c.owner_type][c.owner] || 0) + c.contributions_count;

      return result;
    },
    {
      ...count,
      owned_repo: {},
      other_repo: [],
      User: {},
      Organization: {},
    }
  );

  // sort final count
  let sortedCount = {};
  Object.keys(finalCount).forEach((k) => {
    if (k === "day" || k === "month") {
      sortedCount[k] = Object.fromEntries(
        Object.entries(finalCount[k]).sort((a, b) => b[1][0] - a[1][0])
      );
    } else if (k === "other_repo") {
      sortedCount[k] = finalCount[k].sort(
        (a, b) => b.contributions_count - a.contributions_count
      );
    } else {
      sortedCount[k] = Object.fromEntries(
        Object.entries(finalCount[k]).sort(([, a], [, b]) => b - a)
      );
    }
  });

  // calculate weekly average contributions
  const totalWeeks = Math.floor(
    (today - new Date(createdProfileDate)) / (7 * 24 * 60 * 60 * 1000)
  );
  const weeklyAvgContributions = parseFloat(
    (contributionsCount / totalWeeks).toFixed(3)
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
    contribution_count: contributionsCount,
    weekly_average_contribution: weeklyAvgContributions,
    contribution_count_per_day: sortedCount["day"],
    contribution_count_per_month: sortedCount["month"],
    contribution_count_per_owned_repo: sortedCount["owned_repo"],
    contribution_count_per_other_repo: sortedCount["other_repo"],
    contribution_count_per_repo_org_owner: sortedCount["Organization"],
    contribution_count_per_repo_user_owner: sortedCount["User"],
    external_contribution_to_top_10_repo: sortedIncomingContribution,
  };

  return contribution;
};

export default contributionInference;
