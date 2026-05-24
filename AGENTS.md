# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

# Pull Request Workflow

1. Create a branch, make changes, push, and open a PR with `gh pr create`
2. Wait for the PR to be approved and merged by the repo owner on GitHub — do not merge it yourself
3. Once told the PR is merged, clean up:
   ```bash
   git checkout main && git pull origin main
   git branch -d <branch-name>
   git push origin --delete <branch-name>
   ```
