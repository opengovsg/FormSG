set -x

pr_body_file_groupped='-'
echo "## New" > ${pr_body_file_groupped}

gh auth login

gh pr create \
  -B develop \
  -t "build: create test PR" \
  -d
  # -F ${pr_body_file_groupped}

rm ${pr_body_file_groupped}