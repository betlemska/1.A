import importlib.util,json,subprocess,sys,tempfile,unittest
from pathlib import Path
root=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('school_news',root/'tools/update-school-news.py')
news=importlib.util.module_from_spec(spec);spec.loader.exec_module(news)
class SchoolNewsTests(unittest.TestCase):
 def test_real_feed(self):
  result=news.latest((root/'tests/fixtures/official-school-news.xml').read_bytes())
  self.assertTrue(result['url'].startswith('https://www.betlemska.cz/aktuality/'))
  self.assertTrue(result['title']);self.assertLessEqual(len(result['excerpt']),176)
 def test_newest_date_not_feed_order(self):
  raw=b'<rss><channel><item><title>Older</title><link>https://www.betlemska.cz/aktuality/1</link><pubDate>Mon, 09 Nov 2026 08:00:00 +0100</pubDate></item><item><title>Newer &amp; valid</title><link>https://www.betlemska.cz/aktuality/2</link><pubDate>Tue, 10 Nov 2026 08:00:00 +0100</pubDate><description>&lt;p&gt;Text&lt;/p&gt;</description></item></channel></rss>'
  self.assertEqual(news.latest(raw)['title'],'Newer & valid')
 def test_invalid_feed_does_not_overwrite_snapshot(self):
  with tempfile.TemporaryDirectory() as folder:
   folder=Path(folder);old=(root/'assets/school-news.json').read_bytes()
   target=folder/'snapshot.json';target.write_bytes(old)
   bad=folder/'bad.xml';bad.write_text('<html>Service unavailable</html>')
   result=subprocess.run([sys.executable,str(root/'tools/update-school-news.py'),'--input',str(bad),'--output',str(target)],capture_output=True)
   self.assertNotEqual(result.returncode,0);self.assertEqual(target.read_bytes(),old)
 def test_external_url_and_entities_rejected(self):
  for raw in [b'<!DOCTYPE rss [<!ENTITY a "text">]><rss/>',b'<rss><channel><item><title>Bad</title><link>https://evil.test/aktuality/1</link><pubDate>Mon, 09 Nov 2026 08:00:00 +0100</pubDate></item></channel></rss>']:
   with self.assertRaises(ValueError):news.latest(raw)
if __name__=='__main__':unittest.main()
