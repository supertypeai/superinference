import contributionInference from "./contributionInference";
import profileInference from "./profileInference";
import repositoryInference from "./repositoryInference";
import skillInference from "./skillInference";

const inferFromGithub = async ({
  githubHandle,
  token = null,
  top_repo_n = 3,
  top_language_n = 3,
} = {}) => {
  const profile = await profileInference(githubHandle, token);

  const { stats, originalRepo } = await repositoryInference(
    githubHandle,
    token,
    top_repo_n
  );

  const skill = await skillInference(
    githubHandle,
    profile.bio,
    originalRepo,
    token,
    top_language_n
  );

  const contribution = token
    ? await contributionInference(githubHandle, token)
    : "only available for authorized request";

  return { profile, stats, skill, contribution };
};

export default inferFromGithub;
