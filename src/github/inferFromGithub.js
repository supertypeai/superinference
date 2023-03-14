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

  return { profile, stats, skill };
};

export default inferFromGithub;
