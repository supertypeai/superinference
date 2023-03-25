[![Supertype](https://img.shields.io/badge/supertype.ai-incubate-b1976b)](https://supertype.ai/incubate) &nbsp; &nbsp; ![npm](https://img.shields.io/npm/v/superinference) &nbsp; &nbsp; ![github | superinference](https://img.shields.io/github/package-json/v/supertypeai/superinference) &nbsp; &nbsp; ![license](https://img.shields.io/npm/l/superinference) 

## Superinference

Superinference is a library that infers analysis-ready attributes from a person's social media username or unique identifier and returns them as JSON objects.

It supports both token-based (OAuth) authorization for authenticated requests and unauthenticated requests for public data. It currently supports the following social media channels:

- [x] GitHub
- [x] Dev.to
- [ ] LinkedIn
- [ ] Medium
- [ ] WordPress


It is currently actively being developed so more supported social media channels will be added in the future.

### Use Cases

You might use superinference to generate profile pages of your app users, or to enrich your user data with additional information by inferring them from their social media accounts. You might also use it to accelerate your account creation process by directly inferring attributes such as their email address, name, and profile picture.

## Installation

You can install the package using `yarn` or `npm`:
    
```bash 
yarn add superinference
# or:
npm install superinference
```
This will install `superinference` from npm and add it to your `package.json` file.

## Usage

### Common Patterns

There is nothing magic here. Superinference is just a wrapper around the social media APIs and so it's usage is very simple. Here is how you would extract and infer attributes from a person using he/her GitHub and Dev.to usernames:

```js
import { inferFromDevto, inferFromGithub } from "superinference";

// using then
let profile, skill, stats, activity, contribution, closest_user, bio;
inferFromGithub({ githubHandle:"AurelliaChristie" }).then((data) => {
    // do something with the data, such as setting states or updating UI
    ({ profile, skill, stats, activity, contribution, closest_user, bio } = data);
});
    
inferFromDevto({ devtoHandle:"onlyphantom" }).then((data) => {
    ({ bio } = data);
})

// using await 
const { profile, skill, stats, activity, contribution, closest_user } = await inferFromGithub({ githubHandle:"AurelliaChristie" });
    
const bio = await inferFromDevto({ devtoHandle:"onlyphantom" });
```

Here is the sample result for each of `profile`, `skill`, `stats`, `activity`, `contribution`, `closest_user` and `bio` created from the two function calls above:

```js
// profile
{
    "login": "AurelliaChristie",
    "name": "Aurellia Christie",
    "company": "@supertypeai ",
    "blog": "",
    "location": null,
    "email": null,
    "hireable": null,
    "twitter_username": null,
    "avatar_url": "https://avatars.githubusercontent.com/u/69672839?v=4",
    "bio": "Full Stack Data Scientist at @supertypeai",
    "followers": 8,
    "following": 8
}

// skill
{
    "key_qualifications": [ "consultancy", "full-stack-developer" ],
    "top_n_languages": [ "HTML", "JavaScript", "Python" ],
    "languages_percentage": {
        "HTML": "0.500",
        "JavaScript": "0.333",
        "Python": "0.278",
        "CSS": "0.222",
        "R": "0.111",
        "Jupyter Notebook": "0.056"
    }
}

// stats
{
    "original_repo_count": 18,
    "forked_repo_count": 9,
    "stargazers_count": 2,
    "forks_count": 5,
    "top_repo_stars_forks": [
        {
          "name": "Ad-Fatigued-List-Generator",
          "html_url": "https://github.com/AurelliaChristie/Ad-Fatigued-List-Generator",
          "description": null,
          "top_language": "Python",
          "stargazers_count": 0,
          "forks_count": 1
        },
        {
          "name": "BeautIndonesia",
          "html_url": "https://github.com/AurelliaChristie/BeautIndonesia",
          ...
        },
        {
          "name": "cryptocurrency",
          "html_url": "https://github.com/AurelliaChristie/cryptocurrency",
          ...
        }
    ],
    "top_repo_commits": [
        {
          "name": "CookInd",
          "html_url": "https://github.com/Tech4Impact-21-22/CookInd",
          "description": null,
          "top_language": "HTML",
          "commits_count": 34
        },
        {
          "name": "Ad-Fatigued-List-Generator",
          "html_url": "https://github.com/AurelliaChristie/Ad-Fatigued-List-Generator",
          ...
        },
        {
          "name": "BeautIndonesia",
          "html_url": "https://github.com/AurelliaChristie/BeautIndonesia",
          ...
        }
    ],
    "repo_api_message": "",
    "commit_api_message": ""
}

// activity
{
    "commit_count": 433,
    "weekly_average_commits": "3.639",
    "commit_count_per_day": {
        "Wed": [ 48, 81 ],
        "Thu": [ 41, 87 ],
        "Mon": [ 29, 57 ],
        "Fri": [ 26, 80 ],
        "Tue": [ 26, 70 ],
        "Sat": [ 2, 22 ],
        "Sun": [ 0, 36 ]
    },
    "commit_count_per_month": {
        "Mar": [ 62, 63 ],
        "Feb": [ 33, 33 ],
        "Jun": [ 23, 23 ],
        "Aug": [ 15, 19 ],
        "Jul": [ 14, 29 ],
        "Oct": [ 12, 122 ],
        "Sep": [ 7, 34 ],
        "Nov": [ 3, 34 ],
        "Jan": [ 2, 52 ],
        "Dec": [ 1, 24 ]
    },
    "commit_count_per_owned_repo": {
        "CookInd": 34,
        "Ad-Fatigued-List-Generator": 30,
        ...
    },
    "commit_count_per_other_repo": {
        "generations-frontend": 70,
        "MAL": 27,
        ...
    },
    "commit_count_per_repo_org_owner": { "supertypeai": 144, "Tech4Impact-21-22": 65 },
    "commit_count_per_repo_user_owner": {
        "AurelliaChristie": 200,
        "onlyphantom": 175,
        ...
    },
    "commit_api_message": ""
}

// contribution
{
    "issue_count": 2,
    "total_pr_count": 221,
    "merged_pr_count": 210,
    "contribution_count_per_repo_owner": {
        "onlyphantom": 109,
        "supertypeai": 67,
        ...
    },
    "created_issue":  [
        {
          "issue_title": "Redirect URL in Github Authorization Not Working",
          "created_at": "2023-03-10T08:47:30Z",
          "state": "closed",
          "state_reason": "completed",
          "repo_owner": "supabase",
          "repo_name": "supabase",
          "repo_url": "https://github.com/supabase/supabase"
        },
        {
          "issue_title": "Pictures and icons are not displayed correctly in PDF version",
          "created_at": "2023-03-01T07:59:27Z",
          ...
        },
        ...
    ],
    "created_pr": [
        {
          "pr_title": "Enhance nominate page",
          "created_at": "2023-03-07T08:36:05Z",
          "merged_at": "2023-03-08T04:33:41Z",
          "state": "closed",
          "state_reason": null,
          "repo_owner": "supertypeai",
          "repo_name": "collective",
          "repo_url": "https://github.com/supertypeai/collective"
        },
        {
          "pr_title": "add profile Aurellia",
          "created_at": "2023-03-06T06:59:02Z",
          ...
        },
        ...
    ],
    "issue_api_message": "",
    "pr_api_message": ""
}

// closest_user
{
    "closest_users": [ "onlyphantom", "supertypeai", "Tech4Impact-21-22" ],
    "collaboration_count": {
        "onlyphantom": 284,
        "supertypeai": 211,
        "Tech4Impact-21-22": 99,
        ...
    },
    "commit_api_message": "",
    "issue_api_message": "",
    "pr_api_message": "",
    "repo_api_message": ""
}

// bio
{
    ...,
    "username": "onlyphantom",
    "name": "Samuel Chan",
    "twitter_username": "_onlyphantom",
    "github_username": "onlyphantom",
    "summary": "Co-founder of Algoritma, a data science academy; https://supertype.ai, a full-cycle data science agency;",
    "location": "Indonesia / Singapore",
    "website_url": "https://www.youtube.com/samuelchan",
    "joined_at": "Jul  3, 2019",
    "profile_image": "https://res.cloudinary.com/practicaldev/image/fetch/...
}
```

### Authenticated Requests

The calls in the code example above are unauthorized requests, so it collects data from public profiles and returns information that is available to the public. 

You can optionally pass in an OAuth token to make authenticated requests to, in the case of GitHub, also be able to extract and infer stats from private repositories not available to the public.

```js
inferFromGithub({ githubHandle:"onlyphantom", token:oauth_token, include_private:true, top_repo_n:10, top_language_n:5, closest_user_n:5 })
```

This returns the top 10 repositories, including private ones, the top 5 languages, and the closest 5 users using a GitHub OAuth token.

### API Rate Limit

The APIs we use restrict the number of requests that can be made within a set timeframe. If this limit is exceeded, the API looping will cease and we will provide the inference from the data we have collected thus far. To see this information, you can check the `..._api_message` parameter included in the response. We include this parameter in all responses that are affected. An example of this message can be seen in the code snippet below:

```js
{
  ...,
  "commit_api_message": "Hey there! Looks like the inference above (except the commit_count) is from the latest 800 commits since you've reached the API rate limit 😉"
}
```
