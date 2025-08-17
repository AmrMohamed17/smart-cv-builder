import requests
from os import getenv

GITHUB_API = "https://api.github.com"

def get_user_repos(username, isTest=False):
    if isTest:
        token = getenv("GitHub_Token")
        if not token:
            raise ValueError("❌ GitHub_Token not found in environment variables")
            
        url = f"https://api.github.com/users/{username}/repos"
        headers = {"Authorization": f"token {token}"}
        response = requests.get(url, headers=headers)
    else:
        url = f"{GITHUB_API}/users/{username}/repos"
        response = requests.get(url)

    if response.status_code != 200:
        raise Exception(f"Failed to fetch repos for user {username}: {response.text}")

    return response.json()

def get_readme(owner, repo):
    url = f"{GITHUB_API}/repos/{owner}/{repo}/readme"
    headers = {"Accept": "application/vnd.github.v3.raw"}
    response = requests.get(url, headers=headers)

    if response.status_code == 200:
        return response.text
    else:
        return None  # Some repos may not have a README

def get_repo_details(username, isTest=False):
    repos = get_user_repos(username, isTest)
    repo_data = []

    for repo in repos:
        repo_info = {
            "name": repo["name"],
            "description": repo["description"],
            "url": repo["html_url"],
            "stars": repo["stargazers_count"],
            "language": repo["language"],
            "topics": repo.get("topics", []),
            "updated_at": repo["updated_at"],
            "readme": get_readme(username, repo["name"])
        }
        repo_data.append(repo_info)

    return repo_data


def summarize_github_repos(repos):
    summary = []

    for repo in repos:
        if not repo["description"] and not repo["readme"]:
            continue 

        readme_snippet = ""
        if repo["readme"]:
            readme_snippet = repo["readme"][:700].strip().replace('\n', ' ')
        else:
            readme_snippet = "No README"

        block = (
            f"📦 Repo: {repo['name']}\n"
            f"⭐ Stars: {repo['stars']}\n"
            f"📝 Description: {repo['description'] or 'No description'}\n"
            f"🛠 Tech: {repo['language'] or 'N/A'}\n"
            f"📄 README Snippet: {readme_snippet}\n"
            f"---"
        )
        summary.append(block)

    return "\n".join(summary)



def get_github_data(username="AmrMohamed17", isTest=False):
    repos = get_repo_details(username, isTest)
    return summarize_github_repos(repos)



# if __name__ == "__main__":
#     main()


