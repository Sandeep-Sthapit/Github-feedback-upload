const { Octokit } = require('octokit');
const fs = require('fs')
const csv = require('csvtojson')
const base64 = require('js-base64')

const chalk = require('chalk');
// NCSU Enterprise endpoint:
let urlRoot = "https://github.ncsu.edu/api/v3";

let config = {};
// Retrieve our api token from the environment variables.
config.token = process.env.GITHUBTOKEN;

if (!config.token) {
    console.log(chalk `{red.bold GITHUBTOKEN is not defined!}`);
    console.log(`Please set your environment variables with appropriate token.`);
    console.log(chalk `{italic You may need to refresh your shell in order for your changes to take place.}`);
    process.exit(1);
}

let rawdata = fs.readFileSync('config.json');
let settings = JSON.parse(rawdata);

// initialize octokit
const octokit = new Octokit({
    auth: config.token,
    baseUrl: urlRoot
})




if (process.env.NODE_ENV != 'test') {
    let user = settings.user;
    let org = settings.org;
    let email = settings.email;
    let path = settings.path;
    (async() => {
        let feedbacks = await csv().fromFile(settings.csv);
        for (let i = 0; i < feedbacks.length; i++) {
            feedback = feedbacks[i];
            // console.log(feedback)
            await postFeedback(org, user, email, feedback.repo, path, feedback.feedback);
        }
    })()
}

async function postFeedback(org, user, user_email, repo, path, feedback, commit_msg = "Feedback posted") {
    let get_endpoint = "GET /repos/" + org + "/" + repo + "/contents/" + path;
    let endpoint = "PUT /repos/" + org + "/" + repo + "/contents/" + path;
    let data = base64.encode(feedback);
    console.log(data)

    try {

        const repodata = await octokit.request(get_endpoint, {
            owner: org,
            repo: repo,
            path: path
        })
        const sha = repodata.data.sha
        await octokit.request(endpoint, {
            owner: org,
            repo: repo,
            path: path,
            sha: sha,
            message: commit_msg,
            committer: {
                name: user,
                email: user_email
            },
            content: data
        })
        console.log("successfully added feedback for " + path + " in " + repo);
    } catch (error) {
        console.error(`Could not write feedback: ${error}`)
    }
}


// module.exports.enableWikiSupport = enableWikiSupport;