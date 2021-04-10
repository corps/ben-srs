.PHONY: image
image:
	docker build -t ben-srs .

.PHONY: run
run:
	docker run --rm -p 3009:3009 ben-srs