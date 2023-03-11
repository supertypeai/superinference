import profileInference from "./profileInference";
import repositoryInference from "./repositoryInference";

const inferFromGithub = async (githubHandle, top_repo_n = 3, token = null) => {
    const profile = await profileInference(githubHandle, token);
    const stats = await repositoryInference(githubHandle, top_repo_n, token);

    return { profile, stats };
};

export default inferFromGithub;