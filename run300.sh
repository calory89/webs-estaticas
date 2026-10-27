#!/bin/bash
cd /home/claude/supportnear
while pgrep -f cities_country.py >/dev/null; do sleep 10; done
python3 select300.py >> sel.log 2>&1
python3 fetch300.py >> f300.log 2>&1
echo ALLDONE >> f300.log
