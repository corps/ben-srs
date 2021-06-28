.image: Dockerfile
	docker build --network host --tag bensrs .
	touch .image

bash: .image
	docker run --rm -it -v $$PWD:/app bensrs bash

up: .image
	docker run -d -p 8080:8080 -v $$PWD:/app --name bensrs-srv bensrs websocketd --port 8080 --staticdir dist ./server.sh || true
	docker run -d -v $$PWD:/app --name bensrs-webpack teach-coding webpack --watch || true

down:
	docker stop bensrs-srv || true
	docker stop bensrs-webpack || true
	docker rm bensrs-srv || true
	docker rm bensrs-webpack || true

logs:
	@ docker logs -f bensrs-srv
