all: test

test: node_modules
	npm run test

lint: node_modules
	npm run lint

node_modules: package.json
	npm i

clean:
	rm -rf node_modules

.PHONY: test install clean lint