import importlib.util,unittest,json,tempfile,subprocess,sys
from pathlib import Path
root=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('lunch',root/'tools/update-lunch.py');mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
class LunchTests(unittest.TestCase):
 def test_real_fixture(self):
  j=mod.extract((root/'tests/fixtures/public-menu.html').read_text());d=j['days']['2026-10-27']
  self.assertEqual(len(d['meals']),2);self.assertFalse(d['closed']);self.assertTrue(j['days']['2026-10-28']['closed']);self.assertEqual(j['days']['2026-10-28']['soups'],[])
 def test_preserve_last_good_on_bad_source(self):
  with tempfile.TemporaryDirectory() as folder:
   p=Path(folder);target=p/'lunch.json';previous=(root/'assets/lunch.json').read_bytes();target.write_bytes(previous);(p/'bad.html').write_text('<html>Login or error</html>')
   process=subprocess.run([sys.executable,str(root/'tools/update-lunch.py'),'--input',str(p/'bad.html'),'--output',str(target)],capture_output=True)
   self.assertNotEqual(process.returncode,0);self.assertEqual(target.read_bytes(),previous)
 def test_invalid_source(self):
  for text in ['<html></html>','ejidelnicek.setJidelnicek({});','ejidelnicek.setJidelnicek({"stravaMap":{}});']:
   with self.assertRaises((ValueError,KeyError)):mod.extract(text)
if __name__=='__main__':unittest.main()
