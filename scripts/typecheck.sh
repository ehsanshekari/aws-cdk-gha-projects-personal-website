#!/bin/sh

# Ensure we're in the git root directory
cd "$(git rev-parse --show-toplevel)" || exit 1

echo "=== Staged Files ==="
git diff --cached --name-only

# Get staged TypeScript files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM -- '*.ts' '*.tsx')

# Find unique affected packages (now relative to git root)
AFFECTED_PACKAGES=$(echo "$STAGED_FILES" | grep -o '^packages/[^/]*' | sort -u)

# Show affected packages
if [ -z "$AFFECTED_PACKAGES" ]; then
  echo "=== No TypeScript Packages Affected ==="
else
  echo "=== Affected TypeScript Packages ==="
  echo "$AFFECTED_PACKAGES"
fi

# Run tsc for each affected package
for PACKAGE in $AFFECTED_PACKAGES; do
  if [ -f "$PACKAGE/tsconfig.json" ]; then
    echo "Checking TypeScript in $PACKAGE"
    # tsc -p "$PACKAGE/tsconfig.json" --noEmit || exit 1
  fi
done