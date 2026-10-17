# -*- coding: utf-8 -*-
import json,sys,re
HERE=__import__('os').path.dirname(__import__('os').path.abspath(__file__))
sys.path.insert(0,HERE)
from p1 import D1;from p2 import D2;from p3 import P;from p4 import D4;from p5 import D5,P5;from p6 import D6
from p7 import D7,P7
D={}
for d in (D1,D2,D4,D5,D6,D7): D.update(d)
pats=[[a,b.replace("\\'","'")] for a,b in list(P)+P5+P7 if b is not None]
pats.sort(key=lambda x:-len(x[0]))
js=open(HERE+'/engine.js').read()
js=js.replace('/*EX*/{}',json.dumps(D,ensure_ascii=False)).replace('/*PAT*/[]',json.dumps(pats,ensure_ascii=False))
open(HERE+'/../m_i18n.js','w').write(js)
print(len(D),len(pats))
