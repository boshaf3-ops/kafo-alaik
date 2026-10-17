#!/bin/sh
# يبني الموقع كاملًا من المصادر: الترجمة ثم index.html وsw.js في جذر المستودع
cd "$(dirname "$0")"
python3 i18n/gen.py && python3 make_site.py
