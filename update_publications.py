"""
Refresh publications.json from your Google Scholar profile.

Usage:
    pip install scholarly        # one-time setup
    python update_publications.py

If Google blocks the request, wait a few minutes and try again.
"""

import json
from scholarly import scholarly

SCHOLAR_ID = 'wMsDspYAAAAJ'   # your Google Scholar user ID
NUM_PAPERS = 5                 # number of recent papers to show on the site


def main():
    print(f"Fetching publications from Google Scholar (ID: {SCHOLAR_ID}) ...")

    try:
        author = scholarly.search_author_id(SCHOLAR_ID)
        author = scholarly.fill(author, sections=['publications'])
    except Exception as e:
        print(f"\nERROR: Could not reach Google Scholar.\n  {e}")
        print("This usually means Google temporarily blocked the request.")
        print("Wait a few minutes and try again. publications.json was NOT changed.")
        return

    # Keep only entries that have a publication year, sort newest first
    pubs = sorted(
        [p for p in author['publications'] if p.get('bib', {}).get('pub_year')],
        key=lambda p: int(p['bib']['pub_year']),
        reverse=True
    )[:NUM_PAPERS]

    if not pubs:
        print("No publications with a year found. publications.json was NOT changed.")
        return

    result = []
    for i, pub in enumerate(pubs):
        # Fill each publication individually to get venue/journal details
        print(f"  Fetching details for paper {i+1}/{len(pubs)} ...")
        try:
            scholarly.fill(pub)
        except Exception:
            pass  # use whatever we already have

        bib     = pub.get('bib', {})
        pub_id  = pub.get('author_pub_id', '')
        venue   = (bib.get('venue') or bib.get('journal') or
                   bib.get('booktitle') or bib.get('publisher') or '')

        # Extract last names from author string (handles "A and B and C" or "A, B, C")
        raw_authors = bib.get('author', '')
        if raw_authors:
            parts = ([a.strip() for a in raw_authors.split(' and ')]
                     if ' and ' in raw_authors
                     else [a.strip() for a in raw_authors.split(',')])
            last_names = [p.split()[-1] for p in parts if p.split()]
        else:
            last_names = []

        result.append({
            'title':   bib.get('title', ''),
            'year':    bib.get('pub_year', ''),
            'venue':   venue,
            'authors': last_names,
            'url': (
                'https://scholar.google.com/citations'
                f'?view_op=view_citation&hl=en&user={SCHOLAR_ID}'
                f'&citation_for_view={pub_id}'
            ),
        })

    with open('publications.json', 'w', encoding='utf-8') as f:
        json.dump(result, f, indent=2, ensure_ascii=False)

    print(f"\nDone! Updated publications.json with {len(result)} papers:\n")
    for p in result:
        print(f"  [{p['year']}] {p['title'][:72]}{'...' if len(p['title']) > 72 else ''}")
    print("\nNext: commit and push to publish the changes.")


if __name__ == '__main__':
    main()
