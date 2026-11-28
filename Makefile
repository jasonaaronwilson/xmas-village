JS_FILES := src/js/01-config.js src/js/01b-svg-assets.js $(sort $(filter-out src/js/01-config.js src/js/01b-svg-assets.js,$(wildcard src/js/*.js)))
PARTS := src/part1-head.html src/styles.css src/part2-body.html $(JS_FILES) src/part3-tail.html

all: index.html docs/index.html

src/js/01b-svg-assets.js: src/cottage.svg src/bakery.svg src/cathedral.svg src/horse_and_carriage.svg
	@python3 -c 'import re, base64; items=[("SVG_COTTAGE_URI","src/cottage.svg","680 60 1420 1320",1420,1320),("SVG_BAKERY_URI","src/bakery.svg","640 80 1480 1400",1480,1400),("SVG_CATHEDRAL_URI","src/cathedral.svg","60 80 1680 2120",1680,2120),("SVG_CARRIAGE_URI","src/horse_and_carriage.svg","520 120 1720 1320",1720,1320)]; strip_bg=lambda m: "" if (("0,0" in m.group(1) or "2752" in m.group(1)) and re.match(r"#F[89A-F][0-9A-F]{4}$$", m.group(2), re.I)) else m.group(0); out=[]; [out.append(f"  var {k} = \"data:image/svg+xml;base64," + base64.b64encode(re.sub(r"height=\"[^\"]+\"", f"height=\"{h}\"", re.sub(r"width=\"[^\"]+\"", f"width=\"{w}\"", re.sub(r"viewBox=\"[^\"]+\"", f"viewBox=\"{vb}\"", re.sub(r"<path d=\"([^\"]+)\" fill=\"([^\"]+)\"/>", strip_bg, open(p, encoding="utf-8").read(), count=2), count=1), count=1), count=1).encode("utf-8")).decode("ascii") + "\";\n") for k,p,vb,w,h in items]; open("$@", "w").write("".join(out))'

index.html: $(PARTS)
	cat $(PARTS) > $@

docs/index.html: index.html
	@mkdir -p docs
	cp index.html $@

check: index.html
	@node -e "const fs=require('fs'); const s=fs.readFileSync('index.html','utf8'); const js=s.split('<script>')[1].split('</script>')[0]; new Function(js);"
	@echo "JavaScript syntax OK"

clean:
	rm -f index.html docs/index.html src/js/01b-svg-assets.js

.PHONY: all check clean
