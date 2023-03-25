import activityInference from "./activityInference";
import closestUserInference from "./closestUserInference";
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

  let { stats, originalRepo, repos } = await repositoryInference(
    githubHandle,
    token,
    include_private,
    top_repo_n
  );

  const skill = await skillInference(
    githubHandle,
    profile.bio,
    originalRepo,
    token,
    top_language_n,
    include_private
  );

  // const { contribution, messageIssue, messagePR } = await contributionInference(
  //   githubHandle,
  //   token,
  //   include_private
  // );

  // const { activity, mostActiveRepo, messageCommit } = await activityInference(
  //   githubHandle,
  //   repos,
  //   token,
  //   include_private,
  //   top_repo_n
  // );

  // const { closestUser } = await closestUserInference(
  //   githubHandle,
  //   token,
  //   originalRepo,
  //   contribution,
  //   activity,
  //   closest_user_n,
  //   messageCommit,
  //   messageIssue,
  //   messagePR,
  //   messageRepo
  // );

  // stats = {
  //   ...stats,
  //   top_repo_commits: mostActiveRepo,
  //   repo_api_message: messageRepo ? messageRepo : "",
  //   commit_api_message: messageCommit ? messageCommit : "",
  // };

  return {
    profile,
    skill,
    stats,
    // activity,
    // contribution,
    // closest_user: closestUser,
  };
};

export default inferFromGithub;
