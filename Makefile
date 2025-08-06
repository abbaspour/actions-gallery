all: test

test: node_modules
	pnpm run test

lint: node_modules
	pnpm run lint

build: node_modules
	pnpm run build

node_modules: package.json
	pnpm i

clean:
	rm -rf node_modules

.PHONY: test install clean lint build