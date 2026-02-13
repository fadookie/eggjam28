#!/bin/bash
./make-docs.sh

# Save datestamp and git commit hash to VERSION.txt file
echo -n `date "+%Y%m%d_%H%M"`_`git rev-parse --short HEAD` > VERSION.txt

zip -r ../itch-dev-build.zip * -x 'node_modules/*'
