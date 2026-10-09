/** Explicit ingredient families; unknown products are not presumed vegan. Bread requires a verified product specification. */
const plantIngredients=new Set(['oats','chickpeas','lentils','rice','canned-tomato','tomato','spinach','oil','broccoli','carrot','onion','pepper','cucumber','almonds','chia','beans','peanut','apple','banana','blueberry','strawberry','pasta','lemon','tofu','potato']);
const fishIngredients=new Set(['salmon','tuna']);
export function matchesDiet(id:string,vegetarian:boolean,diet:string){if(diet==='vegan')return plantIngredients.has(id);if(diet==='pescatarian')return vegetarian || fishIngredients.has(id);if(diet==='vegetarian')return vegetarian;return diet==='all' || diet==='halal';}
