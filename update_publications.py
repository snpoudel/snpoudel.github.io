"""
Add new papers from your Google Scholar profile to publications.json.

Usage:
    pip install scholarly        # one-time setup
    python update_publications.py

What it does:
  * Adds any Scholar paper that is not already in publications.json.
  * Never removes papers and never touches links you added by hand
    (press, code, blog, ...), so it is safe to run any time.
  * Flags papers whose Scholar venue changed (e.g. a preprint that is now
    published) so you can update that entry yourself.

After running, open publications.json to tidy any new entry
(title capitalization, "type", extra "links"), then commit and push.

If Google blocks the request, wait a few minutes and try again.
"""

import json
import re
from pathlib import Path

from scholarly import scholarly

SCHOLAR_ID = 'wMsDspYAAAAJ'   # your Google Scholar user ID
DATA_FILE = Path(__file__).with_name('publications.json')

# Scholar entries whose title contains any of these are skipped
SKIP_TITLE_WORDS = ('corrigendum', 'erratum', '(vol ')

CONFERENCE_WORDS = ('meeting', 'abstracts', 'conference', 'congress', 'symposium', 'workshop')
PREPRINT_WORDS = ('ssrn', 'arxiv', 'egusphere', 'essoar', 'research square', 'preprint', 'eartharxiv')


def normalize(title):
    return re.sub(r'[^a-z0-9]', '', title.lower())


def short_name(full_name):
    """'David K Koval' -> 'D. K. Koval'"""
    parts = full_name.replace('.', ' ').split()
    if len(parts) < 2:
        return full_name.strip()
    initials = ' '.join(p[0].upper() + '.' for p in parts[:-1])
    return f'{initials} {parts[-1]}'


def guess_type(venue):
    v = venue.lower()
    if any(w in v for w in PREPRINT_WORDS):
        return 'preprint'
    if any(w in v for w in CONFERENCE_WORDS):
        return 'conference'
    return 'journal'


def main():
    pubs = json.loads(DATA_FILE.read_text(encoding='utf-8')) if DATA_FILE.exists() else []
    by_id = {p.get('scholar_id'): p for p in pubs if p.get('scholar_id')}
    # Talks and manuscripts you added by hand have no scholar_id and are left alone.
    # When a manuscript appears on Scholar it is added as a new entry: delete the old one.
    known_titles = {normalize(p['title']) for p in pubs}

    print(f'Fetching publications from Google Scholar (ID: {SCHOLAR_ID}) ...')
    try:
        author = scholarly.search_author_id(SCHOLAR_ID)
        author = scholarly.fill(author, sections=['publications'])
    except Exception as e:
        print(f'\nERROR: Could not reach Google Scholar.\n  {e}')
        print('Google may have temporarily blocked the request. Wait a few minutes and try again.')
        print('publications.json was NOT changed.')
        return

    added, changed = [], []
    for pub in author['publications']:
        bib = pub.get('bib', {})
        title = bib.get('title', '').strip()
        pub_id = pub.get('author_pub_id', '').split(':')[-1]
        if not title or any(w in title.lower() for w in SKIP_TITLE_WORDS):
            continue

        if pub_id in by_id or normalize(title) in known_titles:
            # Already listed: flag a venue change (e.g. preprint -> journal)
            existing = by_id.get(pub_id)
            citation = bib.get('citation', '')
            if existing and citation and existing['venue'].lower() not in citation.lower():
                changed.append((existing['title'], existing['venue'], citation))
            continue

        print(f'  New: {title[:72]}')
        try:
            scholarly.fill(pub)
            bib = pub.get('bib', {})
        except Exception:
            pass  # use whatever we already have

        venue = (bib.get('journal') or bib.get('venue') or bib.get('conference') or
                 bib.get('booktitle') or bib.get('publisher') or '')
        details = ', '.join(x for x in [
            f"{bib['volume']}({bib['number']})" if bib.get('volume') and bib.get('number') else bib.get('volume', ''),
            bib.get('pages', ''),
        ] if x)
        authors = [short_name(a) for a in bib.get('author', '').split(' and ') if a.strip()]
        year = bib.get('pub_year')

        entry = {
            'scholar_id': pub_id,
            'type': guess_type(venue),
            'title': title,
            'authors': authors,
            'year': int(year) if year and str(year).isdigit() else None,
            'venue': venue,
            'details': details,
            'url': pub.get('pub_url') or (
                'https://scholar.google.com/citations?view_op=view_citation&hl=en'
                f'&user={SCHOLAR_ID}&citation_for_view={SCHOLAR_ID}:{pub_id}'
            ),
            'links': [],
        }
        if entry['type'] == 'conference':
            entry['hidden'] = True   # conference abstracts are kept but not shown on the site
        pubs.insert(0, entry)   # newest first; the site sorts by year anyway
        known_titles.add(normalize(title))
        added.append(entry)

    if added:
        DATA_FILE.write_text(json.dumps(pubs, indent=2, ensure_ascii=False) + '\n', encoding='utf-8')
        print(f'\nAdded {len(added)} paper(s) to publications.json:')
        for p in added:
            print(f"  [{p['year']}] ({p['type']}) {p['title'][:70]}")
        print('\nCheck the new entries in publications.json, then commit and push.')
    else:
        print('\nNo new papers. publications.json is up to date.')

    if changed:
        print('\nThese papers look different on Scholar now (maybe published?):')
        for title, old, new in changed:
            print(f'  - {title[:60]}\n      site:    {old}\n      Scholar: {new}')
        print('Update "venue", "details", "year", "type" and "url" by hand if needed.')


if __name__ == '__main__':
    main()
