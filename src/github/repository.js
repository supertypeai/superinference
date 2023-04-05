import multipageRequest from "./utils/multipageRequest.js";
import request from "./utils/request.js";

const repository = async ({
    githubHandle,
    repositoryName,
    token = null
}) => {
    
    const repoURL = `/repos/${githubHandle}/${repositoryName}`;
    const { data:repository } = await request(repoURL, token)

    // Language Data
    const { data:repositoryLanguage } = await request(repository.languages_url, token);
    const languageData = Object.entries(repositoryLanguage).map(([language, number_of_bytes]) => ({
        language,
        language_used_percentage: ((number_of_bytes / Object.values(repositoryLanguage).reduce((a, b) => a + b)) * 100).toFixed(2) + '%'
        }));

    // Event Data
    const { dataList: repositoryEvent, incompleteResults: incompleteEvent } = await multipageRequest(
        `${repository.events_url}?per_page=100`,
        token
      );

    const countByType = repositoryEvent.reduce((acc, curr) => {
        if (acc[curr.type]) {
          acc[curr.type] += 1;
        } else {
          acc[curr.type] = 1;
        }
        return acc;
      }, {})

    // Contributions Data
    const { dataList: repositoryContributors, incompleteResults: incompleteContributor } = await multipageRequest(
        `${repository.contributors_url}?per_page=100`,
        token
      );

    const totalContributions = repositoryContributors.reduce((acc, curr) => acc + curr.contributions, 0);
    const contributionNumber = repositoryContributors.length;
    
    const contributionsData = repositoryContributors.map(user => ({
        login: user.login,
        html_url: user.html_url,
        repos_url: user.repos_url,
        type: user.type,
        contributions: user.contributions,
        contributions_percentage: `${((user.contributions/totalContributions)*100).toFixed(2)}%`
      }));

    return{
        name: repository.name,
        owner: repository.owner.login,
        owner_url: repository.owner.html_url,
        url: repository.html_url,
        description: repository.description,
        topic: repository.topics,
        visibility: repository.visibility,
        created_at: repository.created_at,
        last_pushed_at: repository.pushed_at,
        main_language: repository.language,
        language: languageData,
        stargazer_count: repository.stargazers_count,
        forks_count: repository.forks_count,
        watchers_count: repository.watchers_count,
        subscribers_count: repository.subscribers_count,
        total_contributions_count: totalContributions,
        contributor_count: contributionNumber,
        incomplete_contributor_results: incompleteContributor,
        contributor_data: contributionsData,
        incomplete_event_results: incompleteEvent,
        event_type_count: countByType,
        open_issue_count: repository.open_issues_count,
    }
}

export default repository;