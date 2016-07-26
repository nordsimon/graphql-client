test:
	mocha test/specs.js

lint:
	standard .

.PHONY: test lint