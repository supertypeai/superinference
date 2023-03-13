import endpoints from "../endpoints.json"

const githubLink = "https://api.github.com";

const bioInference = async (githubHandle,token) => {
    
    // get bio
    const responseBio = await fetch(`${githubLink}/users/${githubHandle}`);
    const dataBio = await responseBio.json();
  
    if (dataBio.message && dataBio.message === "Not Found") {
      throw new Error("Invalid GitHub handle inputted");
    } else {
      const bio = dataBio.bio
    }

    // get readme
    const responseReadMe = await fetch(`${githubLink}/repos/${githubHandle}/${githubHandle}/contents/README.md`)
    const dataReadMe = await responseReadMe.json();

    if (dataReadMe.message && dataReadMe.message === "Not Found") {
        throw new Error("Invalid GitHub handle inputted");
      } else {
        var content = dataReadMe.content
        decodeContent = atob(content);
    }

    // get top language
    const responseRepos = await fetch("https://api.github.com/user/repos?per_page=1000", {
        method: "GET",
        headers: {'Authorization': 'token ' + token}
      })

      const dataRepos = await responseRepos.json()

    var languageList = []
    var privateRepo = []

    for(let i = 0; i < dataRepos.length; i++) {
        let obj = dataRepos[i];
        
        languageList.push(obj.languages_url)
        privateRepo.push(obj.private)
    }

    languages = []

    for(let i=0; i < languageList.length; i++ ){
        const repos = languageList[i]
        const privateStatus = privateRepo[i]

        if (privateStatus){
            const responseLanguage = await fetch(`${repos}?type=private`, {
                method: "GET",
                headers: {'Authorization': 'token ' + token}
              })
    
            const dataLanguage = await responseLanguage.json()
    
            languages.push(dataLanguage)
        } else {
            const responseLanguage = await fetch(repos, {
                method: "GET",
                headers: {'Authorization': 'token ' + token}
              })
    
            const dataLanguage = await responseLanguage.json()
    
            languages.push(dataLanguage)
        }
    }


    var topLanguage = languages.reduce((acc, obj) => {
        for (let [key, value] of Object.entries(obj)) {
          acc[key] = (acc[key] || 0) + value;
        }
        return acc;
      }, {});

    topLanguage = Object.entries(topLanguage).sort((a, b) => b[1] - a[1]);

    topLanguage = Object.fromEntries(topLanguage);

    const topNLanguage = Object.keys(topLanguage).slice(0,5);

    const percentageLanguages = Object.values(topLanguage).reduce((acc, curr) => acc + curr);

    const percentageResult = {};

    for (const key in topLanguage) {
        if (Object.hasOwnProperty.call(topLanguage, key)) {
            percentageResult[key] = ((topLanguage[key] / percentageLanguages) * 100).toFixed(3);
        }
    }
      
    return { bio, decodeContent, percentageResult, topNLanguage}

  };

export default shortBioGenerator;