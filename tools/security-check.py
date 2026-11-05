"""Fail closed for accidental secret files or recognizable credentials. Never print values."""
from pathlib import Path
import argparse,fnmatch,re,subprocess,sys
ROOT=Path(__file__).resolve().parents[1]
BLOCKED=['.env','.env.*','.dev.vars','.dev.vars.*','*.sqlite','*.sqlite3','*.db','*.db-shm','*.db-wal','*.pem','*.key']
PRIVATE_DIRS={'.git','.wrangler','.sites-runtime','node_modules'}
TEXT={'.js','.mjs','.ts','.tsx','.jsx','.json','.md','.html','.py','.yml','.yaml','.txt','.toml','.example'}
PATTERNS=[re.compile(rb'pbkdf2\$100000\$[a-f0-9]{32}\$[a-f0-9]{64}'),re.compile(rb'scrypt\$16384\$8\$5\$[a-f0-9]{32}\$[a-f0-9]{64}'),re.compile(rb'-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----\s*\n[A-Za-z0-9+/]{20,}'),re.compile(rb'(?:ghp_|github_pat_|sk-proj-)[A-Za-z0-9_]{30,}')]
def forbidden(path):
 return any(part in PRIVATE_DIRS for part in path.parts) or (path.name!='.env.example' and any(fnmatch.fnmatch(path.name,p) for p in BLOCKED))
def inspect(paths,root):
 problems=[]
 for path in paths:
  if not path.is_file():continue
  rel=path.relative_to(root)
  if forbidden(rel):problems.append((str(rel),'soukromý soubor'));continue
  if path.suffix not in TEXT and path.name!='.env.example':continue
  blob=path.read_bytes()
  if any(p.search(blob) for p in PATTERNS):problems.append((str(rel),'rozpoznatelný tajný údaj'))
  if path.name=='.env.example':
   for line in blob.decode(errors='replace').splitlines():
    if line.strip() and not line.lstrip().startswith('#') and '=' in line and line.split('=',1)[1].strip():problems.append((str(rel),'vyplněný příklad tajné proměnné'));break
 return problems
def main():
 parser=argparse.ArgumentParser();parser.add_argument('--export',type=Path);args=parser.parse_args()
 if args.export:
  root=args.export.resolve();paths=list(root.rglob('*'))
 else:
  root=ROOT;paths=list((root/'public').rglob('*'))
  result=subprocess.run(['git','ls-files','-z'],cwd=root,capture_output=True)
  if result.returncode==0:paths += [root/entry.decode() for entry in result.stdout.split(b'\0') if entry]
  paths=list(dict.fromkeys(paths))
 problems=inspect(paths,root)
 for name,reason in problems:print(f'Zastaveno: {name} ({reason}).',file=sys.stderr)
 if problems:return 1
 print('Security check: no prohibited runtime files or recognizable credential values found.');return 0
if __name__=='__main__':raise SystemExit(main())
