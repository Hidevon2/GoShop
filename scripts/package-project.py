"""Create a portable source archive without credentials, databases or dependencies."""
from pathlib import Path
import os
import zipfile

root = Path(__file__).resolve().parents[1]
output = root / "artifacts" / "GoShop-project.zip"
output.parent.mkdir(exist_ok=True)
excluded_dirs = {"node_modules", ".data", ".git", "dist", "artifacts", "coverage", ".impeccable", "__pycache__"}
count = 0
with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as archive:
    for folder, directories, files in os.walk(root):
        directories[:] = sorted(name for name in directories if name not in excluded_dirs)
        for name in sorted(files):
            if name == ".env" or (name.startswith(".env.") and name != ".env.example") or name.endswith(".log"):
                continue
            path = Path(folder) / name
            archive.write(path, Path("GoShop") / path.relative_to(root))
            count += 1
with zipfile.ZipFile(output) as archive:
    assert archive.testzip() is None
    assert "GoShop/.env" not in archive.namelist()
    assert "GoShop/.env.example" in archive.namelist()
print(f"Packaged {count} files: {output} ({output.stat().st_size:,} bytes)")
