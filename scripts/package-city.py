"""Package a fresh npm build. Requires Python 3; does not publish or upload."""

import hashlib
import json
import re
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZIP_STORED, ZipFile, ZipInfo

root = Path(__file__).resolve().parents[1]
dist = root / "dist"
package = json.loads((root / "package.json").read_text())
manifest = json.loads((dist / "manifest.json").read_text())
version = manifest["version"]
if not re.fullmatch(r"(?:0|[1-9][0-9]{0,4})(?:\.(?:0|[1-9][0-9]{0,4})){0,3}", version):
    raise SystemExit("Invalid Chrome extension version")
parts = [int(part) for part in version.split(".")]
if not any(parts) or max(parts) > 65535 or package["version"] != version:
    raise SystemExit("Version must be nonzero, valid and match package.json")
if manifest["permissions"] != ["activeTab", "scripting", "storage"] or manifest.get("host_permissions"):
    raise SystemExit("Review changed permissions before packaging")

# An explicit distribution list excludes repository material, source maps and local data.
files = {name: dist / name for name in ("manifest.json", "popup.html", "content.js", "landscape.js")}
for pattern in ("assets/popup-*.js", "assets/city/*.png", "chunks/*.js"):
    files.update((path.relative_to(dist).as_posix(), path) for path in dist.glob(pattern))
for table in (manifest["icons"], manifest["action"]["default_icon"]):
    files.update((name, dist / name) for name in table.values())
for name in ("LICENSE", "THIRD_PARTY_NOTICES.md", "ASSETS.md", "PRIVACY.md"):
    files[name] = root / name
missing = [name for name, path in files.items() if not path.is_file()]
if missing:
    raise SystemExit(f"Missing distribution files: {missing}")

release = root / "release"
release.mkdir(exist_ok=True)
archive = release / f"codeyears-{version}-city.zip"
with ZipFile(archive, "w") as output:
    for name, path in sorted(files.items()):
        info = ZipInfo(name, (1980, 1, 1, 0, 0, 0))
        info.create_system = 3
        info.external_attr = 0o100644 << 16
        output.writestr(info, path.read_bytes(), compress_type=ZIP_STORED if name.endswith(".png") else ZIP_DEFLATED, compresslevel=9)
with ZipFile(archive) as output:
    if output.testzip() is not None:
        raise SystemExit("ZIP integrity check failed")
digest = hashlib.sha256(archive.read_bytes()).hexdigest()
(release / f"{archive.name}.sha256").write_text(f"{digest}  {archive.name}\n")
print(f"{archive.relative_to(root)}: {len(files)} files, {archive.stat().st_size:,} bytes, SHA-256 {digest}")
