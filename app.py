import time
import urllib.request
import xml.etree.ElementTree as ET
from bs4 import BeautifulSoup
from flask import Flask, render_template, jsonify, request

app = Flask(__name__)

# Cache setup (5 minutes TTL)
CACHE_DURATION = 300
cache = {
    'data': None,
    'last_updated': 0
}

URL = "https://docs.cloud.google.com/feeds/bigquery-release-notes.xml"

def parse_entry_content(html_content):
    if not html_content:
        return []
    
    soup = BeautifulSoup(html_content, 'html.parser')
    
    # Format all link elements to open in new tab
    for a in soup.find_all('a'):
        a['target'] = '_blank'
        a['rel'] = 'noopener noreferrer'
        # Convert relative URLs to Google Cloud domain if any
        if a.get('href') and a['href'].startswith('/'):
            a['href'] = 'https://cloud.google.com' + a['href']
            
    items = []
    h3s = soup.find_all('h3')
    
    if not h3s:
        # If there are no subheaders, treat the entire body as a general note
        return [{
            'type': 'General',
            'html': str(soup)
        }]
        
    for h3 in h3s:
        category = h3.get_text().strip()
        
        # Get all sibling HTML until the next h3 tag
        sibling_html = []
        sibling = h3.next_sibling
        while sibling and sibling.name != 'h3':
            # Ignore empty strings/whitespace
            if str(sibling).strip():
                sibling_html.append(str(sibling))
            sibling = sibling.next_sibling
            
        items.append({
            'type': category,
            'html': ''.join(sibling_html).strip()
        })
        
    return items

def fetch_and_parse_feed():
    req = urllib.request.Request(
        URL, 
        headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AntigravityFeedReader/1.0'}
    )
    with urllib.request.urlopen(req, timeout=15) as response:
        xml_content = response.read()
        
    root = ET.fromstring(xml_content)
    ns = {'atom': 'http://www.w3.org/2005/Atom'}
    
    feed_title = root.find('atom:title', ns)
    feed_title_text = feed_title.text if feed_title is not None else "BigQuery - Release notes"
    
    feed_updated = root.find('atom:updated', ns)
    feed_updated_text = feed_updated.text if feed_updated is not None else ""
    
    entries = []
    for entry in root.findall('atom:entry', ns):
        title = entry.find('atom:title', ns)
        title_text = title.text if title is not None else ""
        
        updated = entry.find('atom:updated', ns)
        updated_text = updated.text if updated is not None else ""
        
        link = entry.find("atom:link[@rel='alternate']", ns)
        if link is None:
            link = entry.find("atom:link", ns)
        link_href = link.attrib.get('href', '') if link is not None else ""
        
        content = entry.find('atom:content', ns)
        content_html = content.text if content is not None else ""
        
        parsed_items = parse_entry_content(content_html)
        
        entries.append({
            'date': title_text,
            'updated_iso': updated_text,
            'link': link_href,
            'items': parsed_items
        })
        
    return {
        'title': feed_title_text,
        'feed_updated': feed_updated_text,
        'entries': entries
    }

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/releases')
def get_releases():
    force_refresh = request.args.get('refresh', 'false').lower() == 'true'
    current_time = time.time()
    
    # Serve cached copy if valid and refresh not requested
    if cache['data'] and not force_refresh and (current_time - cache['last_updated'] < CACHE_DURATION):
        return jsonify({
            'source': 'cache',
            'last_updated_time': cache['last_updated'],
            'data': cache['data']
        })
        
    try:
        data = fetch_and_parse_feed()
        cache['data'] = data
        cache['last_updated'] = current_time
        return jsonify({
            'source': 'network',
            'last_updated_time': current_time,
            'data': data
        })
    except Exception as e:
        # Fallback to cache on network failure
        if cache['data']:
            return jsonify({
                'source': 'cache_fallback',
                'error': str(e),
                'last_updated_time': cache['last_updated'],
                'data': cache['data']
            })
        return jsonify({
            'error': 'Failed to fetch release notes and no cache is available.',
            'details': str(e)
        }), 500

if __name__ == '__main__':
    app.run(host='127.0.0.1', port=5000, debug=True)
