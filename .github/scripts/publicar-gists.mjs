// Publica un gist por laboratorio de la ruta de custodia con sus scripts de Node que no dependen
// de otros archivos del repositorio. Lo corre la Action «gists» con el secreto GIST_TOKEN
// (un token de GitHub con permiso «gist»). Guarda el id de cada gist en gists.json para
// actualizarlo en lugar de crear otro.
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const token = process.env.GIST_TOKEN;
if (!token) {
  console.log('Sin GIST_TOKEN: no se publica nada.');
  process.exit(0);
}
const ruta = 'custodia';
const registro = existsSync('gists.json') ? JSON.parse(readFileSync('gists.json', 'utf8')) : {};
const paquete = JSON.parse(readFileSync(path.join(ruta, 'package.json'), 'utf8'));

async function github(metodo, url, cuerpo) {
  const respuesta = await fetch(`https://api.github.com${url}`, {
    method: metodo,
    headers: { authorization: `Bearer ${token}`, accept: 'application/vnd.github+json', 'x-github-api-version': '2022-11-28' },
    body: JSON.stringify(cuerpo),
  });
  if (!respuesta.ok) throw new Error(`${metodo} ${url}: ${respuesta.status} ${await respuesta.text()}`);
  return respuesta.json();
}

for (const laboratorio of readdirSync(ruta, { withFileTypes: true }).filter((e) => e.isDirectory() && !['lib', 'rust', 'node_modules'].includes(e.name))) {
  const carpeta = path.join(ruta, laboratorio.name);
  const scripts = readdirSync(carpeta).filter((f) => f.endsWith('.mjs')).filter((f) => !/from ['"]\.\.?\//.test(readFileSync(path.join(carpeta, f), 'utf8')));
  if (scripts.length === 0) continue;
  const titulo = readFileSync(path.join(carpeta, 'README.md'), 'utf8').split('\n')[0].replace(/^#\s*/, '');
  const files = Object.fromEntries(scripts.map((f) => [f, { content: readFileSync(path.join(carpeta, f), 'utf8') }]));
  files['package.json'] = { content: `${JSON.stringify({ name: `trautslab-${laboratorio.name}`, private: true, type: 'module', dependencies: paquete.dependencies, devDependencies: paquete.devDependencies }, null, 2)}\n` };
  files['LEEME.md'] = { content: `# ${titulo}\n\nLos scripts de Node de este laboratorio que se pueden correr solos. La guía completa y el resto del código: https://github.com/trautslab/laboratorios/tree/main/${carpeta}\n\n\`\`\`bash\nnpm install\nnpx anvil   # en otra terminal\nnode ${scripts[0]}\n\`\`\`\n` };
  const descripcion = `TrautsLab · ${titulo}`;
  const id = registro[laboratorio.name];
  const gist = id ? await github('PATCH', `/gists/${id}`, { description: descripcion, files }) : await github('POST', '/gists', { description: descripcion, public: true, files });
  registro[laboratorio.name] = gist.id;
  console.log(`${laboratorio.name}: ${gist.html_url}`);
}
writeFileSync('gists.json', `${JSON.stringify(registro, null, 2)}\n`);
