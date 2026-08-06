import re
from pathlib import Path

root = Path(__file__).resolve().parent.parent / "src"
color_prefixes = r"brand|rose|emerald|amber|violet|blue|indigo|green|teal|pink|orange|purple|fuchsia|cyan"
pattern_prefix = re.compile(rf"\b(text|bg|border|shadow|from|via|to)-({color_prefixes})-")

files = sorted(root.rglob("*.tsx")) + sorted(root.rglob("*.ts"))
changed = []
for fp in files:
    text = fp.read_text(encoding='utf-8')
    new = text
    # 1) Restore color prefixes to slate preserving suffix: e.g. text-brand-500 -> text-slate-500
    new = pattern_prefix.sub(r"\1-slate-", new)

    # 2) Fix concatenated numeric tokens after slate-
    def fix_token(match):
        token = match.group(0)  # like 'slate-100500' or 'slate-900/10500/10'
        body = token[len('slate-'):]
        if '/' in body:
            parts = body.split('/')
            # keep first and last, join with '/'
            first = parts[0]
            last = parts[-1]
            return f"slate-{first}/{last}"
        else:
            # digits, if longer than 3 take last 3 as suffix
            if len(body) > 3 and body.isdigit():
                return f"slate-{body[-3:]}"
            return token

    new = re.sub(r"slate-[0-9/]+", lambda m: fix_token(m), new)

    if new != text:
        fp.write_text(new, encoding='utf-8')
        changed.append(str(fp.relative_to(root.parent)))

print(f"Fixed {len(changed)} files")
for p in changed:
    print(p)
