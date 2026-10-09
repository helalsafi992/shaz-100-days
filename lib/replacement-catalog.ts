import type {Exercise} from './training';
const e=(id:string,name:string,pattern:string,equipment:string[],instructions:string[],cue:string):Exercise=>({id,name,pattern,equipment,instructions,cue,version:1});
/** New entries remain review content. No fabricated media or clinical clearance. */
export const replacementCatalog:Exercise[]=[
 e('incline-db-press','Skrå brystpres med håndvægte','push',['dumbbells','bench'],['Indstil bænken med let hældning og hold fødderne i gulvet.','Sænk håndvægtene kontrolleret til en behagelig dybde.','Pres op uden at slå håndvægtene sammen.'],'Hold belastningen kontrollerbar.'),
 e('bench-db-press','Bænkpres med håndvægte','push',['dumbbells','bench'],['Læg dig stabilt på bænken med fødderne i gulvet.','Sænk håndvægtene kontrolleret langs brystet.','Pres op uden at miste kontakten med bænken.'],'Vælg en vægt du kan sætte sikkert fra dig.'),
 e('cable-chest-press','Stående brystpres i kabel','push',['cable'],['Stå i skridtstilling med håndtagene ved brystet.','Pres frem uden at svaje i ryggen.','Før håndtagene langsomt tilbage.'],'Hold kroppen stabil.'),
 e('db-lateral-raise','Sideløft med håndvægte','shoulder',['dumbbells'],['Stå oprejst med let bøjede albuer.','Løft armene roligt til en behagelig højde.','Sænk uden at svinge kroppen.'],'Start let og hold bevægelsen smertefri.'),
 e('seated-db-press','Siddende skulderpres','shoulder',['dumbbells','bench'],['Sid stabilt med fødderne i gulvet.','Pres håndvægtene op fra skulderhøjde.','Sænk kontrolleret uden at svaje.'],'Undgå at presse igennem smerte.'),
 e('cable-lateral-raise','Sideløft i kabel','shoulder',['cable'],['Stå med siden til det lave kabel.','Løft armen roligt ud til siden.','Sænk kontrolleret med let bøjet albue.'],'Brug en let belastning.'),
 e('lying-leg-curl','Liggende lårcurl','knee-flexion',['machines'],['Tilpas maskinen så knæet følger dens drejepunkt.','Bøj knæene uden at løfte hoften fra puden.','Sænk roligt tilbage.'],'Undgå stød og store bevægelser i ryggen.'),
 e('standing-cable-curl','Stående lårcurl i kabel','knee-flexion',['cable'],['Fastgør ankelstroppen og hold ved en stabil støtte.','Bøj knæet og før hælen roligt tilbage.','Stræk kontrolleret ud igen.'],'Hold låret i ro.'),
 e('heel-walkout','Hælgang fra hofteløft','knee-flexion',['bodyweight'],['Læg dig på ryggen med knæene bøjede.','Løft hoften let og gå hælene lidt frem med små skridt.','Gå tilbage uden at svaje.'],'Brug kort bevægelse og stop ved krampe eller smerte.'),
 e('seated-db-calf','Siddende lægløft med håndvægt','calf',['dumbbells','bench'],['Sid med fødderne fladt i gulvet og en håndvægt støttet på låret.','Løft hælene kontrolleret.','Sænk langsomt til gulvet.'],'Hold vægten sikkert med hænderne.'),
 e('single-calf','Etbens lægløft med støtte','calf',['bodyweight'],['Hold let ved en stabil støtte.','Løft hælen på ét ben.','Sænk langsomt; gentag på den anden side.'],'Bevæg dig uden at hoppe.'),
 e('legpress-calf','Lægløft i benpres','calf',['machines'],['Indstil maskinen med let belastning og placér forfoden stabilt.','Bevæg anklerne kontrolleret uden at låse knæene.','Sænk hælene i en behagelig bevægebane.'],'Brug maskinens sikkerhedsstop.'),
 e('reverse-lunge','Baglæns udfald med støtte','single',['bodyweight'],['Hold let ved en stabil støtte.','Træd bagud og bøj begge knæ i en behagelig dybde.','Pres op gennem forreste fod og skift ben.'],'Hold balance frem for at søge stor dybde.'),
 e('db-reverse-lunge','Baglæns udfald med håndvægte','single',['dumbbells'],['Hold lette håndvægte langs siden.','Træd bagud og sænk dig roligt.','Vend tilbage og skift ben.'],'Start med små skridt og stabil balance.'),
 e('cable-pull-through','Hoftebøjning i kabel','hinge',['cable'],['Stå med ryggen til et lavt kabel med reb mellem benene.','Skub hoften bagud med let bøjede knæ.','Ret hoften ud uden at overstrække ryggen.'],'Lad hoften styre bevægelsen.'),
];
