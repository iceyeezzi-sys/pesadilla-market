import re

with open('C:/Users/user/Desktop/claude-prueba/pesadilla-store/index.html', 'r', encoding='utf-8') as f:
    content = f.read()

# 1) Eliminar el Hero global (video de fondo fijo en header) que ya no sirve
hero_fixed_start = content.find('<div class="fixed inset-0 z-0">')
if hero_fixed_start != -1:
    hero_fixed_end = content.find('</div>', hero_fixed_start)
    if hero_fixed_end != -1:
        content = content[:hero_fixed_start] + content[hero_fixed_end + len('</div>'):]
        print('Removed global fixed hero div')
    else:
        print('Could not find end of global fixed hero div')
else:
    # Intentar eliminar el bloque .fixed .inset-0 z-0
    hero_pattern = re.compile(r'<div class="fixed inset-0 z-0">.*?</div>', re.DOTALL)
    if hero_pattern.search(content):
        content = hero_pattern.sub('', content)
        print('Removed global fixed hero div (regex)')
    else:
        print('No global hero fixed div found')

# 2) Corregir rutas en imágenes/videos que usen assets/ sin ./ y asegurar ./assets/
def fix_path(m):
    src = m.group(1)
    # si ya empieza con ./assets/ o http o data:, dejarlo
    if src.startswith('./assets/') or src.startswith('http') or src.startswith('data:'):
        return f'src="{src}"'
    # si empieza con /assets/ quitar la barra
    if src.startswith('/assets/'):
        src = './assets' + src[6:]  # /assets/ -> ./assets/
    # si no tiene ./assets/ añadirlo
    if not src.startswith('assets/'):
        src = './assets/' + src
    return f'src="{src}"'

# img tags
content = re.sub(r'<img\s+[^>]*src="([^"]+)"[^>]*>', fix_path, content)
# video tags (source children)
content = re.sub(r'<source\s+src="([^"]+)"', fix_path, content)
print('Fixed asset paths')

# 3) Añadir onerror="this.onerror=null;this.src='./assets/fallback.jpg'" en img/video para fallback
# Solo si no tiene ya onerror
content = re.sub(r'(<img[^>]*src=")([^"]+)("[^>]*>)',
                 lambda m: m.group(1) + m.group(2) + m.group(3).replace('>', ' onerror="this.onerror=null;this.src=\'./assets/fallback.jpg\';this.setAttribute(\'data-fallback\',true);">', 1),
                 content)

with open('C:/Users/user/Desktop/claude-prueba/pesadilla-store/index.html', 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')