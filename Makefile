MOCHA_TARGET=test/specs.js

test:
	make testonly && make lint

testonly:
	mocha $(MOCHA_TARGET)

testonly-watch:
	mocha -w $(MOCHA_TARGET)

lint:
	standard .

.PHONY: test testonly testonly-watch lint