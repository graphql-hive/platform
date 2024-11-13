#/bin/bash

# This script is doing the following:
# 1. Get the version of the apollo-router and the plugin from the Cargo.toml and package.json files
# 2. Check if there are changes in the Cargo.toml and package.json files in the current commit
# 3. If there are changes, check if the image tag exists in the GitHub Container Registry
# 4. If the image tag does not exist, print the image tag and exit with 0
# 5. If the image tag exists, exit with 1
#
# This script is executed in CI, see the .github/workflows/apollo-router-release.yml workflow file

image_name="apollo-router"
github_org="graphql-hive"
router_version=$(cargo tree -i apollo-router --quiet | head -n 1 | awk -F" v" '{print $2}')
plugin_version=$(jq -r '.version' packages/libraries/router/package.json)
has_changes=$(git diff HEAD~ HEAD --name-only -- 'packages/libraries/router/Cargo.toml' 'Cargo.lock' 'packages/libraries/router/package.json')

if [ "$has_changes" ]; then
  image_tag_version="router${router_version}-plugin${plugin_version}"

  response=$(curl -L \
    -H "Accept: application/vnd.github+json" \
    -H "Authorization: Bearer ${GITHUB_TOKEN}" \
    -H "X-GitHub-Api-Version: 2022-11-28" \
    -s \
    https://api.github.com/orgs/${github_org}/packages/container/${image_name}/versions)
  tag_exists=$(echo "$response" | jq -r ".[] | .metadata.container.tags[] | select(. | contains(\"${image_tag_version}\"))")

  if [ ! "$tag_exists" ]; then
    echo "$image_tag_version"
    exit 0
  fi
fi

exit 1
