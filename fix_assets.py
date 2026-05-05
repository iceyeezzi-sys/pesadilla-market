import os, re

base = 'C:/Users/user/Desktop/claude-prueba/pesadilla-store'
html_path = os.path.join(base, 'index.html')

with open(html_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Remove global fixed video div
pattern_div = re.compile(r'<div class="fixed inset-0 z-0">.*?</div>', re.DOTALL)
if pattern_div.search(content):
    content = pattern_div.sub('', content)
    print('Removed global fixed video div')

# 2. Fix img/video/source paths to ensure ./assets/ prefix
def fix_src(m):
    src = m.group(1)
    if src.startswith('http') or src.startswith('data:') or src.startswith('./assets/'):
        return m.group(0)
    if src.startswith('assets/'):
        src = './' + src
    elif not src.startswith('./'):
        src = './assets/' + src.lstrip('/')
    return 'src="' + src + '"'

content = re.sub(r'src="([^"]+)"', fix_src, content)
print('Fixed asset paths')

# 3. Validate asset files exist
asset_refs = re.findall(r'(?:src|href)="(./assets/[^"]+)"', content)
missing = []
for ref in set(asset_refs):
    path = ref.replace('./', base + '/').replace('/', os.sep)
    if not os.path.exists(path):
        missing.append(ref)
if missing:
    print('Missing assets:')
    for m in missing: print(' ', m)
else:
    print('All asset references exist')

with open(html_path, 'w', encoding='utf-8') as f:
    f.write(content)
print('Done')