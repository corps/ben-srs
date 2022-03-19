help: ## Display help text
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) /dev/null | \
		sed 's/^[^:]*://' | sort | \
		awk -F':.*?## ' '{printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.image: Dockerfile Makefile
	docker build --build-arg UID=$(shell id -u) --build-arg GID=$(shell id -g) --network host --tag bensrs .
	touch .image

.PHONY: build-docs
build-docs: .image # Builds the docs directory.
	docker run -v $$PWD/docs:/app/docs -u $(shell id -u):$(shell id -g) -e NODE_ENV=production bensrs webpack

.PHONY: bash
bash: .image ## Start a bash development shell
	docker run --rm -it -v $$PWD:/app -u $(shell id -u):$(shell id -g) bensrs bash

.PHONY: up
up: .image ## Runs a development server
	docker run -d -p 8080:8080 -v $$PWD:/app -u $(shell id -u):$(shell id -g) --name bensrs-srv bensrs websocketd --port 8080 --staticdir docs ./src/server.ts || true
	docker run -d -v $$PWD:/app -u $(shell id -u):$(shell id -g) --name bensrs-webpack bensrs webpack --watch || true

.PHONY: down
down:  ## Brings down the development server
	docker stop bensrs-srv || true
	docker stop bensrs-webpack || true
	docker rm bensrs-srv || true
	docker rm bensrs-webpack || true

.PHONY: logs
logs: ## Follows webpack logs
	@ docker logs -f bensrs-srv
