.PHONY: build
build: gen format check test
	make -C ./python image
	docker image tag corps/python:latest corps/bensrs:latest
	docker push corps/bensrs:latest

.PHONY: format
format:
	make -C ./python format
	make -C ./node format

.PHONY: check
check:
	make -C ./python check
	make -C ./node check

.PHONY: test
test:
	make -C ./python test
	make -C ./node test

./node/react_app/endpoints.ts: ./python/flask_server/endpoints.py
	pydantic2ts --module ./python/flask_server/endpoints.py --output ./node/react_app/endpoints.ts

./python/requirements.txt:
	pip freeze | grep -v "file:" > ./python/requirements.txt

.PHONY: gen
gen: ./node/react_app/endpoints.ts ./python/requirements.txt