import endpoints from "../endpoints.json"

const githubLink = endpoints["github"];

const profileInference = async (githubHandle) => {
  const response = await fetch(`${githubLink}/users/${githubHandle}`);

  const data = await response.json();

  if (data.message && data.message === "Not Found") {
    throw new Error("Invalid GitHub handle inputted");
  } else {
    const { login, name, avatar_url, bio, followers, following } = data;
    const profile = { login, name, avatar_url, bio, followers, following };
    return profile;
  }
};

export default profileInference;
