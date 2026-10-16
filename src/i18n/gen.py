# -*- coding: utf-8 -*-
import json,sys,re
sys.path.insert(0,'/home/claude/i18n')
from p1 import D1;from p2 import D2;from p3 import P;from p4 import D4;from p5 import D5,P5
D={}
for d in (D1,D2,D4,D5): D.update(d)
pats=[[a,b.replace("\\'","'")] for a,b in list(P)+P5 if b is not None]
pats.sort(key=lambda x:-len(x[0]))
js=open('/home/claude/i18n/engine.js').read()
js=js.replace('/*EX*/{}',json.dumps(D,ensure_ascii=False)).replace('/*PAT*/[]',json.dumps(pats,ensure_ascii=False))
open('/home/claude/kafo/m_i18n.js','w').write(js)
print(len(D),len(pats))
