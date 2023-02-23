TAG:=corps/python:latest

.PHONY: installation
installation:
	pip install -r requirements.txt

.PHONY: image
image:
	make -C ../node image
	docker build . --tag $(TAG)

.PHONY: shell
shell: image
	docker run -it $(TAG) bash

.PHONY: format
format:
	black .

.PHONY: check
check:
	mypy --install-types

.PHONY: test
test: image
	docker run --rm $(TAG) pytest

.PHONY: run
run: image
	docker run -it -p 3000:3000 --rm $(TAG)
