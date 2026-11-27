JS_FILES := src/js/01-config.js src/js/01b-svg-assets.js $(sort $(filter-out src/js/01-config.js src/js/01b-svg-assets.js src/js/02b-svg-assets.js,$(wildcard src/js/*.js)))
PARTS := src/part1-head.html src/styles.css src/part2-body.html $(JS_FILES) src/part3-tail.html

all: index.html docs/index.html

src/js/01b-svg-assets.js: src/cottage.svg
	@python3 -c "import re, base64; s=open('src/cottage.svg','r',encoding='utf-8').read(); s=re.sub(r'<path[^>]*fill=\"#FEFEFE\"[^>]*/>','',s,count=1); s=re.sub(r'viewBox=\"[^\"]+\"','viewBox=\"680 60 1420 1320\"',s,count=1); s=re.sub(r'width=\"[^\"]+\"','width=\"1420\"',s,count=1); s=re.sub(r'height=\"[^\"]+\"','height=\"1320\"',s,count=1); b=base64.b64encode(s.encode('utf-8')).decode('ascii'); open('$@','w').write('  var SVG_COTTAGE_URI = \"data:image/svg+xml;base64,'+b+'\";\n')"

index.html: $(PARTS)
	cat $(PARTS) > $@

docs/index.html: index.html
	@mkdir -p docs
	cp index.html $@

check: index.html
	@node -e "const fs=require('fs'); const s=fs.readFileSync('index.html','utf8'); const js=s.split('<script>')[1].split('</script>')[0]; new Function(js);"
	@echo "JavaScript syntax OK"

clean:
	rm -f index.html docs/index.html src/js/01b-svg-assets.js src/js/02b-svg-assets.js

.PHONY: all check clean
