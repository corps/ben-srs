NIXPKGS_ALLOW_UNSUPPORTED_SYSTEM:=1

.PHONY: push
push: build-image
	docker push corps/bensrs:latest

.PHONY: build-image
build-image:
	cat $$(nix-build base-image.nix) | docker load
	docker build . --tag corps/bensrs:latest
