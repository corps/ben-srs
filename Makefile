.PHONY: push
push: build-image
	docker push corps/bensrs:latest

shell: build-image
	docker run --rm -it corps/bensrs:latest bash

.PHONY: build-image
build-image:
	cat $$(nix-build base-image.nix) | docker load
	docker build . --tag corps/bensrs:latest
