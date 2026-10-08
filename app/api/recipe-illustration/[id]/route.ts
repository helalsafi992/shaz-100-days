import { recipes, ingredients } from "@/lib/recipes";
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params,
    r = recipes.find((r) => r.id === id);
  if (!r) return new Response("Not found", { status: 404 });
  const palette: Record<string, string> = {
    tomato: "#c85335",
    "canned-tomato": "#c85335",
    spinach: "#254d31",
    broccoli: "#427644",
    carrot: "#e28d32",
    pepper: "#c35032",
    cucumber: "#679f62",
    blueberry: "#424b75",
    strawberry: "#ba4850",
    banana: "#dcc769",
    apple: "#85a55e",
    tofu: "#e9d9b5",
    egg: "#e5b843",
    chicken: "#c69868",
    salmon: "#dc9770",
    beans: "#82473e",
    lentils: "#ac7d4a",
    chickpeas: "#ccad70",
    rice: "#cab68c",
    pasta: "#d3b071",
    bread: "#9d733f",
    oats: "#bd986c",
    almonds: "#8c5835",
    peanut: "#b08045",
    chia: "#403b35",
    yogurt: "#f5f0df",
    milk: "#f7f3e7",
  };
  let shapes = "";
  const list = r.ingredients.filter((x) => !["oil", "lemon"].includes(x.id));
  list.forEach((ing, j) => {
    for (let k = 0; k < 9; k++) {
      const angle = (j / list.length) * Math.PI * 2 + k * 0.12,
        rad = 30 + (k % 4) * 17,
        x = 200 + Math.cos(angle) * rad,
        y = 115 + Math.sin(angle) * rad * 0.72;
      shapes += `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="${9 + (k % 5) * 2}" ry="${6 + (k % 3) * 3}" transform="rotate(${j * 31 + k * 23} ${x} ${y})" fill="${palette[ing.id] || "#cdb98b"}" stroke="#fff" stroke-opacity=".16"/>`;
    }
  });
  const title = r.name.replace(/[&<>"']/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="230" viewBox="0 0 400 230" role="img"><title>Ingrediensillustration: ${title}</title><rect width="400" height="230" fill="#e4dfd1"/><path d="M0 50L400 0M0 130L400 80M0 210L400 160" stroke="#d2cbbd" stroke-width="1"/><ellipse cx="200" cy="121" rx="115" ry="90" fill="#b1a68f" opacity=".15"/><ellipse cx="200" cy="115" rx="111" ry="87" fill="#faf8f0"/><ellipse cx="200" cy="115" rx="93" ry="70" fill="#eee9dc"/>${shapes}<path d="M46 60V178M39 60V85Q46 101 53 85V60M347 61V179M347 61Q365 98 347 114" fill="none" stroke="#788174" stroke-width="3" stroke-linecap="round"/></svg>`;
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public,max-age=86400",
      "Content-Security-Policy":
        "default-src 'none'; style-src 'unsafe-inline'; sandbox",
    },
  });
}
