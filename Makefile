JS_FILES := $(sort $(wildcard src/js/*.js))
PARTS := src/part1-head.html src/styles.css src/part2-body.html $(JS_FILES) src/part3-tail.html

all: index.html docs/index.html

index.html: $(PARTS)
	cat $(PARTS) > $@

docs/index.html: index.html
	@mkdir -p docs
	cp index.html $@

check: index.html
	@node -e "const fs=require('fs'); const s=fs.readFileSync('index.html','utf8'); const js=s.split('<script>')[1].split('</script>')[0]; new Function(js);"
	@echo "JavaScript syntax OK"

clean:
	rm -f index.html docs/index.html

.PHONY: all check clean
