build:
	npm run build

dev:
	npm run dev

# bumps the version file
#
# how to use:
# - edit package.json and change version
# - run `just version`
# - add git tag without any prefixes and push --tags
version:
	npm run version
