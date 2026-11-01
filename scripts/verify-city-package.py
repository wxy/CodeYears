"""Verify a City ZIP against this checkout and its fresh build (Python 3 stdlib)."""

import argparse
import fnmatch
import json
import posixpath
import re
import sys
from pathlib import Path
from zipfile import BadZipFile, ZipFile

ROOT = Path(__file__).resolve().parents[1]
FIXED = {'manifest.json', 'popup.html', 'entry.js', 'content.js', 'landscape.js'}
NOTICES = {'LICENSE', 'THIRD_PARTY_NOTICES.md', 'ASSETS.md', 'PRIVACY.md'}
SCOPE = ['https://github.com/*']
ENTRY = [{'matches': SCOPE, 'js': ['entry.js'], 'run_at': 'document_idle'}]
WAR = [{'resources': ['content.js', 'landscape.js', 'chunks/*.js', 'assets/city/*.png'], 'matches': SCOPE}]


def require(condition, message):
    if not condition:
        raise ValueError(message)


def read_json(path):
    return json.loads(path.read_text(encoding='utf-8'))


def verify(archive, build):
    package = read_json(ROOT / 'package.json')
    lock = read_json(ROOT / 'package-lock.json')
    source = read_json(ROOT / 'public/manifest.json')
    with ZipFile(archive) as zipped:
        entries = zipped.infolist()
        names = [entry.filename for entry in entries]
        require(len(names) == len(set(names)), 'duplicate ZIP path')
        for name in names:
            require(not name.startswith('/') and '\\' not in name
                    and all(part not in ('', '.', '..') for part in name.split('/'))
                    and not re.match(r'^[A-Za-z]:', name), f'unsafe ZIP path: {name}')
        require(zipped.testzip() is None, 'ZIP CRC failure')
        names = set(names)
        require('manifest.json' in names, 'missing manifest.json')
        manifest = json.loads(zipped.read('manifest.json'))
        version = manifest['version']
        require(isinstance(version, str) and re.fullmatch(r'(?:0|[1-9][0-9]{0,4})(?:\.(?:0|[1-9][0-9]{0,4})){0,3}', version)
                and any(int(p) for p in version.split('.'))
                and max(int(p) for p in version.split('.')) <= 65535, 'invalid Chrome version')
        require(all(v == version for v in (package['version'], lock['version'],
                lock['packages']['']['version'], source['version'])), 'version mismatch')
        require(manifest.get('manifest_version') == 3, 'expected MV3')
        require(manifest.get('permissions') == ['activeTab', 'scripting', 'storage'], 'permissions changed')
        require(not any(key in manifest for key in ('host_permissions', 'optional_permissions', 'optional_host_permissions')), 'host/optional permissions forbidden')
        require(manifest.get('content_scripts') == ENTRY, 'automatic entry scope changed')
        require(manifest.get('web_accessible_resources') == WAR, 'resource exposure changed')
        require(manifest.get('content_security_policy') == {'extension_pages': "script-src 'self'; object-src 'none'"}, 'CSP changed')
        require(manifest == source, 'manifest differs from checkout; review new capabilities')

        # Same distribution boundary as package-city.py, with public PNG inventory
        # independent of dist, so a missing copied/dynamically named image fails too.
        icons = {f'icons/codeyears-{size}.png' for size in (16, 32, 48, 128)}
        require(set(manifest['icons'].values()) == icons
                and set(manifest['action']['default_icon'].values()) == icons, 'icon inventory changed')
        expected = {name: build / name for name in FIXED | icons}
        for path in (ROOT / 'public/assets/city').glob('*.png'):
            name = path.relative_to(ROOT / 'public').as_posix()
            expected[name] = build / name
        for pattern in ('assets/popup-*.js', 'chunks/*.js'):
            paths = list(build.glob(pattern))
            require(paths, f'build missing {pattern}')
            expected.update((p.relative_to(build).as_posix(), p) for p in paths)
        expected.update((name, ROOT / name) for name in NOTICES)
        require(names == set(expected), f'file inventory mismatch; missing={sorted(set(expected) - names)}, extra={sorted(names - set(expected))}')

        def reference(owner, target, root=False):
            name = target if root else posixpath.normpath(posixpath.join(posixpath.dirname(owner), target))
            require(name in names, f'missing reference: {owner} -> {target}')

        reference('manifest.json', manifest['action']['default_popup'], True)
        for group in manifest['content_scripts']:
            for name in group['js']:
                reference('manifest.json', name, True)
        for group in manifest['web_accessible_resources']:
            for pattern in group['resources']:
                require(any(fnmatch.fnmatchcase(name, pattern) for name in names), f'unmatched resource: {pattern}')
        for name in sorted(names):
            data = zipped.read(name)
            if name.endswith(('.js', '.html', '.css')):
                text = data.decode('utf-8')
                # Current Vite output: static/dynamic imports, runtime getURL,
                # HTML src/href and CSS url. Not a general JavaScript parser.
                for target in re.findall(r'''(?:import\s*\(\s*|from\s*|getURL\s*\(\s*)["'`]([^"'`]+\.js)["'`]''', text):
                    reference(name, target, not target.startswith('.'))
                for target in re.findall(r'''(?:src|href)=["']([^"']+)["']|url\(["']?([^\s)'";]+)''', text):
                    reference(name, target[0] or target[1])
                # Catalog also carries non-runtime candidate paths; only bare
                # PNG names are actual legacy local resources. unit-${id}.png
                # and outskirts templates are covered by the full PNG inventory.
                for target in re.findall(r'''["'`]([\w-]+\.png)["'`]''', text):
                    reference(name, 'assets/city/' + target, True)
            require(expected[name].is_file(), f'missing build/source file: {name}')
            require(data == expected[name].read_bytes(), f'content differs from fresh build/source: {name}')
            require(data, f'empty release file: {name}')
        print(f'PASS: {len(names)} files; version {version}; CRC, inventory, references, permissions and notices verified')
        print('Asset notice presence does not confirm AI bitmap distribution rights.')


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('archive', type=Path, help='City ZIP to verify')
    parser.add_argument('--build-dir', type=Path, default=ROOT / 'dist', help='fresh npm build output (default: dist)')
    args = parser.parse_args()
    try:
        verify(args.archive, args.build_dir)
    except (OSError, ValueError, KeyError, TypeError, BadZipFile, RuntimeError) as error:
        print(f'FAIL: {error}', file=sys.stderr)
        return 1
    return 0


if __name__ == '__main__':
    sys.exit(main())
