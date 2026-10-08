"""Reproduce ingredient values from USDA SR Legacy April 2018 CSV (public domain).
Usage: python scripts/import-nutrition.py /path/to/extracted/dataset
Download: https://fdc.nal.usda.gov/fdc-datasets/FoodData_Central_sr_legacy_food_csv_2018-04.zip
"""
import csv,json,sys,pathlib
root=pathlib.Path(sys.argv[1]);foods={x['fdc_id']:x for x in csv.DictReader(open(root/'food.csv'))}
# Key, source food ID, Danish label, weight basis, exclusion labels, vegetarian.
items=[('oats','169705','Havregryn','tør vægt',['gluten'],True),('yogurt','170894','Græsk yoghurt naturel, fedtfattig','som købt',['milk'],True),('chickpeas','173801','Kikærter på dåse','drænet og skyllet',[],True),('lentils','172420','Linser','tør vægt',[],True),('rice','169703','Brune ris','tør vægt',[],True),('chicken','171077','Kyllingebryst uden skind','rå vægt',[],False),('canned-tomato','170051','Tomater på dåse','inklusive saft',[],True),('tomato','170457','Tomat','rå spiselig vægt',[],True),('spinach','168462','Spinat','rå vægt',[],True),('oil','171413','Olivenolie','som købt',[],True),('broccoli','170379','Broccoli','rå spiselig vægt',[],True),('carrot','170393','Gulerod','rå spiselig vægt',[],True),('onion','170000','Løg','rå pillet vægt',[],True),('pepper','170108','Rød peberfrugt','rå uden stilk og kerner',[],True),('cucumber','168409','Agurk med skræl','rå vægt',[],True),('almonds','170567','Mandler','som købt',['nuts'],True),('chia','170554','Chiafrø','tør vægt',[],True),('beans','175243','Kidneybønner på dåse','drænet og skyllet',[],True),('egg','171287','Æg','rå uden skal',['egg'],True),('milk','170872','Mælk, 1 % fedt','som købt',['milk'],True),('salmon','175167','Laks','rå spiselig vægt',['fish'],False),('tuna','171986','Tun i vand','drænet vægt',['fish'],False),('bread','172688','Fuldkornsbrød','som købt',['gluten'],True),('peanut','172470','Peanutbutter uden salt','som købt',['peanut'],True),('apple','171688','Æble med skræl','uden kernehus',[],True),('banana','173944','Banan','uden skræl',[],True),('blueberry','171711','Blåbær','rå vægt',[],True),('strawberry','167762','Jordbær','uden stilk',[],True),('pasta','169738','Fuldkornspasta','tør vægt',['gluten'],True),('lemon','167747','Citronsaft','presset saft',[],True),('tofu','172475','Fast tofu naturel','som købt',['soy'],True),('potato','170026','Kartofler med skræl','rå spiselig vægt',[],True)]
wanted={v[1] for v in items};values={k:{} for k in wanted}
keys={'1008':'kcal','1003':'protein','1004':'fat','1005':'carbs','1079':'fiber'}
for r in csv.DictReader(open(root/'food_nutrient.csv')):
 if r['fdc_id'] in wanted and r['nutrient_id'] in keys: values[r['fdc_id']][keys[r['nutrient_id']]]=float(r['amount'])
out=[]
for key,id,name,basis,tags,veg in items:
 assert len(values[id])==5,(id,values[id])
 out.append(dict(id=key,name=name,basis=basis,allergens=tags,vegetarian=veg,halal=True,source='USDA FoodData Central / SR Legacy, April 2018',sourceId=id,sourceDescription=foods[id]['description'],sourceUrl='https://fdc.nal.usda.gov/food-details/'+id+'/nutrients',per100g=values[id]))
pathlib.Path('lib/data/ingredients.json').write_text(json.dumps(out,ensure_ascii=False,indent=2)+'\n')
print('Imported',len(out),'documented ingredients; no nutrient values are manually invented.')
