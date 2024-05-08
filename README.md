# Dashboard Template Setup

## Getting Started

This guide provides step-by-step instructions to set up the dashboard template from the repository for your development environment.

### Prerequisites

-   Git (Download from [git-scm.com](https://git-scm.com/))

### 1. Clone the Repository

Clone the `v2` branch of the dashboard template repository and set the remote name to "template":

```bash
git clone -b v2 --single-branch git@github.com:sianida26/dashboard-template.git --origin template
```

### 2. Switch to Main Branch

After cloning, switch to the main branch:

```bash
cd dashboard-template
git checkout main
```

### 3. Disable Push to Template Remote

Set the "template" remote to be unpushable to prevent accidental updates:

```bash
git remote set-url --push template no_push
```

## Usage

You're now ready to use the dashboard template. Begin your project modifications in the main branch. For further customizations, consult the Git documentation or raise an issue in the repository.
