# Team4_Placeholder



## Getting started

To make it easy for you to get started with GitLab, here's a list of recommended next steps.

Already a pro? Just edit this README.md and make it your own. Want to make it easy? [Use the template at the bottom](#editing-this-readme)!

## Add your files

* [Create](https://docs.gitlab.com/user/project/repository/web_editor/#create-a-file) or [upload](https://docs.gitlab.com/user/project/repository/web_editor/#upload-a-file) files
* [Add files using the command line](https://docs.gitlab.com/topics/git/add_files/#add-files-to-a-git-repository) or push an existing Git repository with the following command:

```
cd existing_repo
git remote add origin https://gitlab.endava.com/techfest/team4_placeholder.git
git branch -M main
git push -uf origin main
```

## Integrate with your tools

* [Set up project integrations](https://gitlab.endava.com/techfest/team4_placeholder/-/settings/integrations)

## Collaborate with your team

* [Invite team members and collaborators](https://docs.gitlab.com/user/project/members/)
* [Create a new merge request](https://docs.gitlab.com/user/project/merge_requests/creating_merge_requests/)
* [Automatically close issues from merge requests](https://docs.gitlab.com/user/project/issues/managing_issues/#closing-issues-automatically)
* [Enable merge request approvals](https://docs.gitlab.com/user/project/merge_requests/approvals/)
* [Set auto-merge](https://docs.gitlab.com/user/project/merge_requests/auto_merge/)

## Test and Deploy

Use the built-in continuous integration in GitLab.

* [Get started with GitLab CI/CD](https://docs.gitlab.com/ci/quick_start/)
* [Analyze your code for known vulnerabilities with Static Application Security Testing (SAST)](https://docs.gitlab.com/user/application_security/sast/)
* [Deploy to Kubernetes, Amazon EC2, or Amazon ECS using Auto Deploy](https://docs.gitlab.com/topics/autodevops/requirements/)
* [Use pull-based deployments for improved Kubernetes management](https://docs.gitlab.com/user/clusters/agent/)
* [Set up protected environments](https://docs.gitlab.com/ci/environments/protected_environments/)

***

# Editing this README

When you're ready to make this README your own, just edit this file and use the handy template below (or feel free to structure it however you want - this is just a starting point!). Thanks to [makeareadme.com](https://www.makeareadme.com/) for this template.

## Suggestions for a good README

Every project is different, so consider which of these sections apply to yours. The sections used in the template are suggestions for most open source projects. Also keep in mind that while a README can be too long and detailed, too long is better than too short. If you think your README is too long, consider utilizing another form of documentation rather than cutting out information.

## Name
Choose a self-explaining name for your project.

## Description
Let people know what your project can do specifically. Provide context and add a link to any reference visitors might be unfamiliar with. A list of Features or a Background subsection can also be added here. If there are alternatives to your project, this is a good place to list differentiating factors.

## Badges
On some READMEs, you may see small images that convey metadata, such as whether or not all the tests are passing for the project. You can use Shields to add some to your README. Many services also have instructions for adding a badge.

## Visuals
Depending on what you are making, it can be a good idea to include screenshots or even a video (you'll frequently see GIFs rather than actual videos). Tools like ttygif can help, but check out Asciinema for a more sophisticated method.

## Installation
Within a particular ecosystem, there may be a common way of installing things, such as using Yarn, NuGet, or Homebrew. However, consider the possibility that whoever is reading your README is a novice and would like more guidance. Listing specific steps helps remove ambiguity and gets people to using your project as quickly as possible. If it only runs in a specific context like a particular programming language version or operating system or has dependencies that have to be installed manually, also add a Requirements subsection.

## Usage
Use examples liberally, and show the expected output if you can. It's helpful to have inline the smallest example of usage that you can demonstrate, while providing links to more sophisticated examples if they are too long to reasonably include in the README.

## Support
Tell people where they can go to for help. It can be any combination of an issue tracker, a chat room, an email address, etc.

## Roadmap
If you have ideas for releases in the future, it is a good idea to list them in the README.

## Contributing
State if you are open to contributions and what your requirements are for accepting them.

For people who want to make changes to your project, it's helpful to have some documentation on how to get started. Perhaps there is a script that they should run or some environment variables that they need to set. Make these steps explicit. These instructions could also be useful to your future self.

You can also document commands to lint the code or run tests. These steps help to ensure high code quality and reduce the likelihood that the changes inadvertently break something. Having instructions for running tests is especially helpful if it requires external setup, such as starting a Selenium server for testing in a browser.

## Authors and acknowledgment
Show your appreciation to those who have contributed to the project.

## License
For open source projects, say how it is licensed.

## Project status
If you have run out of energy or time for your project, put a note at the top of the README saying that development has slowed down or stopped completely. Someone may choose to fork your project or volunteer to step in as a maintainer or owner, allowing your project to keep going. You can also make an explicit request for maintainers.

## Local setup

### 1. Clone the repository

Clone the repository and open the project folder:

```powershell
git clone <repository-url>
cd team4_placeholder
```

### 2. Create the environment file

Copy the environment template:

```powershell
Copy-Item .env.example .env
```

The `.env` file contains local credentials and must not be committed or pushed to Git.

### 3. Start Rancher Desktop

Open Rancher Desktop and wait until it is fully started.

Docker Engine must be running. Kubernetes is not required for this project.

Verify that Docker is available:

```powershell
docker --version
docker compose version
```

### 4. Start PostgreSQL and pgAdmin

Make sure you are in the project root, where `docker-compose.yaml` is located:

```powershell
docker compose -f docker-compose.yaml config
```

If no error is displayed, start the containers:

```powershell
docker compose -f docker-compose.yaml up -d
```

Check the container status:

```powershell
docker ps
```

The following containers should be running:

```text
safeflow-postgres
safeflow-pgadmin
```

### 5. Access and configure pgAdmin

Open pgAdmin in your browser:

```text
http://localhost:5050
```

You will see the pgAdmin login page.

Use the values from your local `.env` file:

```text
Email: the value of PGADMIN_EMAIL
Password: the value of PGADMIN_PASSWORD
```

For example:

```text
Email: admin@safeflow.dev
Password: SafeFlowAdmin123
```

After logging in, register the PostgreSQL server:

1. In the left panel, right-click **Servers**.
2. Select **Register → Server**.
3. In the **General** tab, enter:

```text
Name: SafeFlow PostgreSQL
```

4. Open the **Connection** tab and enter:

```text
Host name/address: postgres
Port: 5432
Maintenance database: safeflow
Username: safeflow_user
Password: the value of POSTGRES_PASSWORD from .env
```

5. Enable **Save password**.
6. Click **Save**.

Important: use `postgres` as the host name, not `localhost`.

The pgAdmin and PostgreSQL containers communicate through the Docker network, where the PostgreSQL service is called `postgres`.

After saving the connection, expand:

```text
Servers
└── SafeFlow PostgreSQL
    └── Databases
        └── safeflow
            └── Schemas
                └── public
                    └── Tables
```

Right-click **Tables** and select **Refresh** to see the database tables.

The PostgreSQL database is available to applications running on the host machine at:

```text
localhost:5432
```

Other Docker containers connect to PostgreSQL using:

```text
postgres:5432
```

### 6. Install Python dependencies

Activate the virtual environment and install the project dependencies:

```powershell
.\.venv\Scripts\activate
pip install -r requirements.txt
```

### 7. Start the FastAPI backend

```powershell
cd backend
python -m uvicorn app.main:app --reload
```

The API will be available at:

```text
http://127.0.0.1:8000
```

Swagger documentation:

```text
http://127.0.0.1:8000/docs
```

Health check:

```text
http://127.0.0.1:8000/health
```

### 8. Stop the containers

To stop the containers without deleting the database data:

```powershell
docker compose -f docker-compose.yaml down
```

Do not use `docker compose down -v` unless you intentionally want to delete the local database volumes.
