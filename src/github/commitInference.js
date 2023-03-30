function convertDatesToDays(contributions) {
  return contributions.map(contribution => {
    const date = new Date(contribution.date);
    const day = date.toLocaleString('en-us', { weekday: 'long' });
    return { day, contributionCount: contribution.contributionCount };
  });
}

function countWeeksBetweenDates(date1, date2) {
  const millisecondsPerWeek = 1000 * 60 * 60 * 24 * 7;
  const timeDifferenceInMilliseconds = new Date(date2).getTime() - new Date(date1).getTime();
  const weeks = Math.round(timeDifferenceInMilliseconds / millisecondsPerWeek);
  return weeks;
}

const githubLink = "https://api.github.com"

const commitInference = async (githubHandle,token) => {

  const profileURL = await fetch(`${githubLink}/users/${githubHandle}`)
  const profile = await profileURL.json();

  const createdAt = profile.created_at
  const createdYear = new Date(createdAt).getFullYear();

  const today = new Date().toISOString()
  const todayYear = new Date().getFullYear();

  const numberOfWeek = countWeeksBetweenDates(createdAt.slice(0,10), today.slice(0,10))

  // Number Contributions per User Count

  let contributionsArray = []
  let commitCounts = 0
  let contributionCounts = 0

  for (let i = createdYear; i <= todayYear; i++) {

      let query 
      if (i == createdYear){
          query = `query {
              user(login: "${githubHandle}") {
                contributionsCollection(from: "${createdAt}", to: "${i}-12-31T23:59:59Z") {
                  totalCommitContributions
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
      } else if (i == todayYear){
          query = `query {
              user(login: "${githubHandle}") {
                contributionsCollection(from: "${i}-01-01T00:00:00Z", to: "${today}") {
                  totalCommitContributions
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
      } else {
          query = `query {
              user(login: "${githubHandle}") {
                contributionsCollection(from: "${i}-01-01T00:00:00Z", to: "${i}-12-31T23:59:59Z") {
                  totalCommitContributions
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
      }
    
      try {
        const response = await fetch('https://api.github.com/graphql', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            query: query,
          }),
        });
        
        const { data } = await response.json();
  
        const concatenatedArray = data.user.contributionsCollection.contributionCalendar.weeks.map(item => item.contributionDays).reduce((acc, cur) => acc.concat(cur), []);
  
        contributionsArray = contributionsArray.concat(concatenatedArray)

        commitCounts += data.user.contributionsCollection.totalCommitContributions

        contributionCounts += data.user.contributionsCollection.contributionCalendar.totalContributions

      } catch (error) {
        console.error(error);
      }
    }

    const weeklyCommitCounts = (commitCounts/numberOfWeek).toFixed(2)
    const weeklyContributionsCounts = (contributionCounts/numberOfWeek).toFixed(2)

    // Daily Contribution
    const dailyContribution = convertDatesToDays(contributionsArray)

    const contributionsbyDayAlltime = dailyContribution.reduce((acc, curr) => {
      if (!acc[curr.day]) {
        acc[curr.day] = curr.contributionCount;
      } else {
        acc[curr.day] += curr.contributionCount;
      }
      return acc;
    }, {});

    const lastYearDailyContribution = dailyContribution.slice(-365).reduce((acc, curr) => {
      if (!acc[curr.day]) {
        acc[curr.day] = curr.contributionCount;
      } else {
        acc[curr.day] += curr.contributionCount;
      }
      return acc;
    }, {});

    const dayContribution = {};

      for (const key in contributionsbyDayAlltime) {
          if (key in lastYearDailyContribution) {
              dayContribution[key] = [lastYearDailyContribution[key], contributionsbyDayAlltime[key]];
          } else {
              dayContribution[key] = [contributionsbyDayAlltime[key]];
          }
      }

    // Monthly Contribution
    const contributionsByMonthAlltime = contributionsArray.reduce((acc, curr) => {
      const month = new Date(curr.date).toLocaleString('default', { month: 'long' });
      acc[month] = acc[month] ? acc[month] + curr.contributionCount : curr.contributionCount;
      return acc;
    }, {});

    const aggregatedData = contributionsArray.reduce((acc, { date, contributionCount }) => {
      const [year, month] = date.split('-');
      const monthKey = `${year}-${month}`;
      
      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthKey, contributionCount: 0 };
      }
      
      acc[monthKey].contributionCount += contributionCount;
      
      return acc;
    }, {});
    
    const lastOneYearMonthlyContribution = Object.values(aggregatedData).slice(-12).reduce((acc, curr) => {
      const date = new Date(curr.month);
      const monthName = date.toLocaleString('default', { month: 'long' });
      acc[monthName] = curr.contributionCount;
      return acc;
    }, {});

    const monthContribution = {};

      for (const key in contributionsByMonthAlltime) {
          if (key in lastOneYearMonthlyContribution) {
              monthContribution[key] = [lastOneYearMonthlyContribution[key], contributionsByMonthAlltime[key]];
          } else {
              monthContribution[key] = [contributionsByMonthAlltime[key]];
          }
      }

  // Repository Contributions Count
  
  let contributionsArrayRepo = []
 
  for (let i = createdYear; i <= todayYear; i++) {

    let query;

    if (i == createdYear){
        query = `query {
            user(login: "${githubHandle}") {
              contributionsCollection(from: "${createdAt}", to: "${i}-12-31T23:59:59Z") {
                commitContributionsByRepository(maxRepositories: 100) {
                  repository {
                    description
                    name
                    url
                    owner {
                      login
                    }
                  }
                  contributions {
                    totalCount
                  }
                }
              }
            }
          }`;
    } else if (i == todayYear){
        query = `query {
            user(login: "${githubHandle}") {
              contributionsCollection(from: "${i}-01-01T00:00:00Z", to: "${today}") {
                commitContributionsByRepository(maxRepositories: 100) {
                  repository {
                    description
                    name
                    url
                    owner {
                      login
                    }
                  }
                  contributions {
                    totalCount
                  }
                }
              }
            }
          }`;
    } else {
        query = `query {
            user(login: "${githubHandle}") {
              contributionsCollection(from: "${i}-01-01T00:00:00Z", to: "${i}-12-31T23:59:59Z") {
                commitContributionsByRepository(maxRepositories: 100) {
                  repository {
                    description
                    name
                    url
                    owner {
                      login
                    }
                  }
                  contributions {
                    totalCount
                  }
                }
              }
            }
          }`;
    }      
        try {
          const response = await fetch('https://api.github.com/graphql', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              query: query,
            }),
          });
          
          const { data } = await response.json();

          const dataArray = data.user.contributionsCollection.commitContributionsByRepository.map(({ repository, contributions }) => {
            return {
                name: repository.name,
                owner: repository.owner.login,
                html_url: repository.url,
                description: repository.description,
                contributions_count: contributions.totalCount,
            };
          })

          contributionsArrayRepo = contributionsArrayRepo.concat(dataArray)

        } catch (error) {
            console.error(error);
          }
        }

        const allContributions = Object.values(
          contributionsArrayRepo.reduce((acc, curr) => {
              const key = JSON.stringify({
                name: curr.name,
                owner: curr.owner,
                html_url: curr.html_url,
                descriptions: curr.descriptions
              });
              if (acc[key]) {
                acc[key].contributions_count += curr.contributions_count;
              } else {
                acc[key] = {
                  ...curr,
                  contributions_count: curr.contributions_count
                };
              }
              return acc;
            }, {})
          );

        const contributionOwnedRepo = allContributions.reduce((acc, repo) => {
            if (repo.owner === `${githubHandle}`) {
              acc[repo.name] = repo.contributions_count;
            }
            return acc;
          }, {});
        
        const contributionOtherRepo = allContributions.filter(repo => repo.owner !== `${githubHandle}`)

        let contributionPerUser = allContributions.reduce((acc, curr) => {
            if (acc[curr.owner]) {
              acc[curr.owner] += curr.contributions_count;
            } else {
              acc[curr.owner] = curr.contributions_count;
            }
            return acc;
          }, {});

          contributionPerUser = Object.fromEntries(
            Object.entries(contributionPerUser).filter(([key, value]) => key !== 'undefined' && !isNaN(value))
          );

  const contribution = {
      commit_count: commitCounts,
      weekly_average_commits: weeklyCommitCounts,
      contributionCounts: contributionCounts,
      weekly_average_contributions: weeklyContributionsCounts,
      commit_count_per_day: dayContribution,
      commit_count_per_month: monthContribution,
      commit_count_per_owned_repo: contributionOwnedRepo,
      commit_count_per_other_repo: contributionOtherRepo,
      commit_count_per_repo_owner: contributionPerUser
      };
  
  return contribution;
}

export default commitInference;