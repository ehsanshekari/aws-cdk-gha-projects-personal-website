#!/bin/bash

# Navigate to project root
cd "$(dirname "$0")/.." || exit 1

npx husky init

# Create the commit-msg hook
cat > .husky/commit-msg << 'EOF'
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

npx --no -- commitlint --edit "$1"
EOF

chmod +x .husky/commit-msg
echo -e "\xE2\x9C\x85 commit-msg hook created successfully!"

# Create the pre-commit hook
cat > .husky/pre-commit << 'EOF'
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

npx lint-staged
EOF

chmod +x .husky/pre-commit
echo -e "\xE2\x9C\x85 pre-commit hook created successfully!"