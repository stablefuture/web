"""Publish existing O*NET 30.0 work context, activities and skill importance.
No task scoring. Original student scenarios are not a validated skills test.
Usage: python3 scripts/build-pathfinder-profile.py [path/to/Skills.txt]
"""
import csv,json,sys,zipfile,xml.etree.ElementTree as ET
from pathlib import Path
ROOT=Path(__file__).resolve().parents[2]
RAW=ROOT/'jobs/data/raw/onet-30.0'
skills_path=Path(sys.argv[1]) if len(sys.argv)>1 else RAW/'Skills.txt'
careers={}
skills={'2.A.1.a','2.A.1.b','2.A.1.c','2.A.1.d','2.A.1.e','2.A.2.a','2.B.1.a','2.B.2.i','2.B.4.g','2.B.4.h'}
work={'4.C.2.a.1.c':'outdoors','4.C.1.b.1.e':'team','4.C.1.a.4':'people','4.C.3.a.4':'autonomy','4.C.3.d.1':'pressure','4.A.4.a.5':'helping'}
def add(row,kind):
    element=row['Element ID'];scale='CX' if kind=='context' else 'IM'
    if row['Scale ID']!=scale or row.get('Recommend Suppress')=='Y' or row.get('Not Relevant')=='Y':return
    if kind=='skills' and element not in skills or kind!='skills' and element not in work:return
    career=careers.setdefault('onet:'+row['O*NET-SOC Code'],{'skills':{},'work':{}})
    # CX and IM both use 1–5; normalised for preference comparisons, not probabilities.
    value=round((float(row['Data Value'])-1)/4,4)
    assert 0<=value<=1
    career['skills' if kind=='skills' else 'work'][element if kind=='skills' else work[element]]=value
for filename,kind in [(RAW/'Work_Context.txt','context'),(skills_path,'skills')]:
    for row in csv.DictReader(filename.open(encoding='utf-8-sig'),delimiter='\t'):add(row,kind)
with zipfile.ZipFile(RAW/'Work_Activities.xlsx') as z:
    ns={'x':'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    strings=[''.join(t.itertext()) for t in ET.fromstring(z.read('xl/sharedStrings.xml')).findall('x:si',ns)]
    rows=ET.fromstring(z.read('xl/worksheets/sheet1.xml')).findall('.//x:row',ns)
    def cells(row):
        out={}
        for c in row:
            v=c.find('x:v',ns)
            if v is not None:out[''.join(filter(str.isalpha,c.get('r')))]=strings[int(v.text)] if c.get('t')=='s' else v.text
        return out
    header=cells(rows[0])
    for row in rows[1:]:add({header[k]:v for k,v in cells(row).items()},'activity')
out={'meta':{'version':'O*NET 30.0','source':'https://www.onetcenter.org/database.html','licence':'https://creativecommons.org/licenses/by/4.0/','skillsSource':'https://www.onetcenter.org/dl_files/database/db_30_0_text/Skills.txt','note':'US occupation averages; CX/IM normalised from 1–5 to 0–1. Not individual proficiency. Original question wording; mapping is a product judgement.'},'careers':careers}
for career in careers.values():
    values=[career['skills'][k] for k in ('2.B.4.g','2.B.4.h') if k in career['skills']]
    if values:career['work']['improving']=round(sum(values)/len(values),4)
(ROOT/'web/public/pathfinder-profile-evidence.json').write_text(json.dumps(out,separators=(',',':'))+'\n')
print(f'{len(careers)} O*NET careers; {sum(bool(c["skills"]) for c in careers.values())} with skills')
