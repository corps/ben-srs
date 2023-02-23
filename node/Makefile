TAG:=corps/node:latest

.PHONY: installation
installation:
	npm install

.PHONY: image
image:
	docker build . --tag $(TAG)

shell: image
	docker run -it $(TAG) bash

.PHONY: check
check:
	eslint --ext .jsx,.js.jsx,.js,ts,tsx ./react_app

.PHONY: format
format:
	prettier --config .prettierrc 'react_app/**/*.tsx' 'react_app/**/*.ts' --write
	eslint --fix --ext .jsx,.js.jsx,.js,ts,tsx ./react_app

.PHONY: test
test: image
	#docker run $(TAG)
	echo 1