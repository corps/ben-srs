.PHONY: build-image
build-image:
	cat $$(nix-build base-image.nix) | docker load
	docker build .
