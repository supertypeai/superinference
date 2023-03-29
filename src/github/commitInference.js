function convertDatesToDays(contributions) {
    return contributions.map(contribution => {
      const date = new Date(contribution.date);
      const day = date.toLocaleString('en-us', { weekday: 'long' });
      return { day, contributionCount: contribution.contributionCount };
    });
  }

const githubLink = "https://api.github.com"

const commitInference = async (githubHandle,token) => {

    const profileURL = await fetch(`${githubLink}/users/${githubHandle}`)
    const profile = await profileURL.json();

    const createdAt = profile.created_at
    const createdYear = new Date(createdAt).getFullYear();

    const today = new Date().toISOString()
    const todayYear = new Date().getFullYear();

    let contributionsArray = []

    for (let i = createdYear; i <= todayYear; i++) {

        let query 
        if (i == createdYear){
            query = `query {
                user(login: "${githubHandle}") {
                  contributionsCollection(from: "${createdAt}", to: "${i}-12-31T23:59:59Z") {
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

        } catch (error) {
          console.error(error);
        }
      }

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

    const contribution = {
        commit_count_per_day: dayContribution,
        commit_count_per_month: monthContribution
        };
    
    return contribution;
  }
  
export default commitInference;
  
