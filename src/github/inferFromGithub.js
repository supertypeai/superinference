import activityInference from "./activityInference";
import contributionInference from "./contributionInference";
import profileInference from "./profileInference";
import repositoryInference from "./repositoryInference";
import skillInference from "./skillInference";

const inferFromGithub = async ({
  githubHandle,
  token = null,
  include_private = false,
  top_repo_n = 3,
  top_language_n = 3,
  closest_user_n = 3,
} = {}) => {
  const profile = await profileInference(githubHandle, token);

  let { stats, originalRepo, repos, messageRepo } = await repositoryInference(
    githubHandle,
    token,
    include_private,
    top_repo_n
  );

  const skill = await skillInference(
    githubHandle,
    profile.bio,
    originalRepo,
    messageRepo,
    token,
    top_language_n
  );

  const { contribution, messageIssue, messagePR } = await contributionInference(
    githubHandle,
    token,
    include_private
  );

  const { activity, mostActiveRepo, messageCommit } = await activityInference(
    githubHandle,
    repos,
    token,
    include_private,
    top_repo_n
  );

  stats = {
    ...stats,
    top_repo_commits: mostActiveRepo,
    repo_api_message: messageRepo ? messageRepo : "",
    commit_api_message: messageCommit ? messageCommit : "",
  };

  const usersCount = Object.keys(
    contribution.contribution_count_per_repo_owner
  ).reduce(
    (result, c) => {
      result[c] =
        (result[c] || 0) + contribution.contribution_count_per_repo_owner[c];
      return result;
    },
    {
      ...activity.commit_count_per_repo_user_owner,
      ...activity.commit_count_per_repo_org_owner,
    }
  );
  const sortedUsersCount = Object.fromEntries(
    Object.entries(usersCount).sort(([, a], [, b]) => b - a)
  );
  delete sortedUsersCount[githubHandle];
  const closestUser = {
    closest_users: Object.keys(sortedUsersCount).slice(0, closest_user_n),
    collaboration_count: sortedUsersCount,
    commit_api_message: messageCommit ? messageCommit : "",
    issue_api_message: messageIssue ? messageIssue : "",
    pr_api_message: messagePR ? messagePR : "",
    repo_api_message: messageRepo ? messageRepo : "",
  };

  return {
    profile,
    skill,
    stats,
    activity,
    contribution,
    closest_user: closestUser,
  };
};

export default inferFromGithub;
