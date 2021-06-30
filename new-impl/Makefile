.image: Dockerfile Makefile
	docker build --build-arg UID=$(shell id -u) --build-arg GID=$(shell id -g) --network host --tag bensrs .
	touch .image

bash: .image
	docker run --rm -it -v $$PWD:/app -u $(shell id -u):$(shell id -g) bensrs bash

up: .image
	docker run -d -p 8080:8080 -v $$PWD:/app -u $(shell id -u):$(shell id -g) --name bensrs-srv bensrs websocketd --port 8080 --staticdir dist ./server.sh || true
	docker run -d -v $$PWD:/app -u $(shell id -u):$(shell id -g) --name bensrs-webpack teach-coding webpack --watch || true

down:
	docker stop bensrs-srv || true
	docker stop bensrs-webpack || true
	docker rm bensrs-srv || true
	docker rm bensrs-webpack || true

logs:
	@ docker logs -f bensrs-srv
