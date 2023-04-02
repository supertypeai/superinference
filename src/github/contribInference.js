import graphqlRequest from "./utils/graphqlRequest";

const contribInference = async (
  githubHandle,
  createdProfileDate,
  token = null
) => {
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

  const queryPatternRepo = (githubHandle, startDate, endDate) => {
    return `query {
        user(login: "${githubHandle}") {
          contributionsCollection(from: "${new Date(
            startDate
          ).toISOString()}", to: "${new Date(endDate).toISOString()}") {
            commitContributionsByRepository(maxRepositories: 100) {
              repository {
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
              }
              contributions {
                totalCount
              }
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
    const newContributionRepo =
      dataRepo.user.contributionsCollection.commitContributionsByRepository.map(
        ({ repository, contributions }) => {
          return {
            name: repository.name,
            owner: repository.owner.login,
            owner_type: repository.owner["__typename"],
            html_url: repository.url,
            description: repository.description,
            top_language: repository.languages.nodes[0]
              ? repository.languages.nodes[0].name
                  .toLowerCase()
                  .replace(/ /g, "-")
              : null,
            contributions_count: contributions.totalCount,
          };
        }
      );
    contributionsPerRepo = contributionsPerRepo.concat(newContributionRepo);
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
        const index = result[repoType].findIndex((obj) => obj.name === c.name);

        if (index === -1) {
          const { owner_type, ...data } = c;
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
  const weeklyAvgContributions = (contributionsCount / totalWeeks).toFixed(3);

  const contribution = {
    contribution_count: contributionsCount,
    weekly_average_contribution: weeklyAvgContributions,
    contribution_count_per_day: sortedCount["day"],
    contribution_count_per_month: sortedCount["month"],
    contribution_count_per_owned_repo: sortedCount["owned_repo"],
    contribution_count_per_other_repo: sortedCount["other_repo"],
    contribution_count_per_repo_org_owner: sortedCount["Organization"],
    contribution_count_per_repo_user_owner: sortedCount["User"],
  };

  return contribution;
};

export default contribInference;
