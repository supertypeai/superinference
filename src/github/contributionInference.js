import endpoints from "../endpoints.json";

const githubLink = endpoints["github"];

const contributionInference = async (githubHandle, token) => {
  // issue
  const responseIssue = await fetch(
    `${githubLink}/search/issues?q=type:issue author:${githubHandle}&sort=author-date&order=desc&per_page=500`,
    {
      method: "GET",
      headers: {
        Authorization: `token ${token}`,
      },
    }
  );
  const dataIssue = await responseIssue.json();

  const issues = await Promise.all(
    dataIssue.items.map(async (i) => {
      if (i.author_association !== "OWNER") {
        const responseRepo = await fetch(i.repository_url, {
          method: "GET",
          headers: {
            Authorization: `token ${token}`,
          },
        });
        const dataRepo = await responseRepo.json();
        return {
          issue_title: i.title,
          created_at: i.created_at,
          state: i.state,
          state_reason: i.state_reason,
          repo_owner: dataRepo.owner.login,
          repo_owner_type: dataRepo.owner.type,
          repo_name: dataRepo.name,
          repo_url: dataRepo.html_url,
          repo_top_language: dataRepo.language,
        };
      }
    })
  );

  issues.filter((i) => i !== undefined);

  const orgIssues = issues.filter(
    (i) => i.repo_owner_type === "Organization"
  ).length;
  const userIssues = issues.filter(
    (i) => i.repo_owner_type !== "Organization"
  ).length;

  // pr
  const responsePR = await fetch(
    `${githubLink}/search/issues?q=type:pr is:merged author:${githubHandle}&sort=author-date&order=desc&per_page=500`,
    {
      method: "GET",
      headers: {
        Authorization: `token ${token}`,
      },
    }
  );
  const dataPR = await responsePR.json();

  const pr = await Promise.all(
    dataPR.items.map(async (p) => {
      if (p.author_association !== "OWNER") {
        const responseRepo = await fetch(p.repository_url, {
          method: "GET",
          headers: {
            Authorization: `token ${token}`,
          },
        });
        const dataRepo = await responseRepo.json();
        return {
          pr_title: p.title,
          created_at: p.created_at,
          merged_at: p.pull_request.merged_at,
          state: p.state,
          state_reason: p.state_reason,
          repo_owner: dataRepo.owner.login,
          repo_owner_type: dataRepo.owner.type,
          repo_name: dataRepo.name,
          repo_url: dataRepo.html_url,
          repo_top_language: dataRepo.language,
        };
      }
    })
  );

  pr.filter((p) => p !== undefined);

  const orgPR = pr.filter((p) => p.repo_owner_type === "Organization").length;
  const userPR = pr.filter((p) => p.repo_owner_type !== "Organization").length;

  return {
    org_issue_count: orgIssues,
    user_issue_count: userIssues,
    org_merged_pr_count: orgPR,
    user_merged_pr_count: userPR,
    created_issue: issues,
    merged_pr: pr,
  };
};

export default contributionInference;
