help: ## Display help text
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) /dev/null | \
		sed 's/^[^:]*://' | sort | \
		awk -F':.*?## ' '{printf "\033[36m%-20s\033[0m %s\n", $$1, $$2}'

.image: Dockerfile Makefile authorized_keys utilities.sh ngrok.yml
	docker build --tag bensrs-worker .
	touch .image

.PHONY: up
up: .image # Builds the docs directory.
	docker run -d --rm -it --name bensrs-worker  bensrs-worker bash -c 'source utilities.sh && b.serve && sleep infinity'

.PHONY: down
down: .image # Builds the docs directory.
	docker stop bensrs-worker

.PHONY: bash
bash: .image # Builds the docs directory.
	docker run --rm -it bensrs-worker bash
