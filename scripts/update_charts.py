import hashlib
import json
import re
import time
from datetime import datetime
from pathlib import Path
from urllib.parse import quote, urljoin
from zoneinfo import ZoneInfo

import requests
from bs4 import BeautifulSoup


OUTPUT_FILE = Path.cwd() / "chart-data.json"
ALBUM_DIR = Path.cwd() / "assets" / "albums"
ALBUM_DIR.mkdir(parents=True, exist_ok=True)

TARGET_ARTISTS = {
    "G-DRAGON",
    "BIGBANG",
}

SOURCES = [
    {
        "id": "melonTop100",
        "name": "멜론 TOP100",
        "type": "realtime",
        "url": "https://www.melon.com/chart/index.htm",
        "parser": "melon",
    },
    {
        "id": "melonDaily",
        "name": "멜론 일간",
        "type": "daily",
        "url": "https://www.melon.com/chart/day/index.htm",
        "parser": "melon",
    },
    {
        "id": "genieTop200",
        "name": "지니 TOP200",
        "type": "realtime",
        "url": "https://www.genie.co.kr/chart/top200",
        "parser": "genie",
    },
    {
        "id": "bugsRealtime",
        "name": "벅스 실시간",
        "type": "realtime",
        "url": "https://music.bugs.co.kr/chart/track/realtime/total",
        "parser": "bugs",
    },
]

DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/126.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    "Accept": (
        "text/html,application/xhtml+xml,application/xml;q=0.9,"
        "image/avif,image/webp,*/*;q=0.8"
    ),
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
}

SITE_REFERERS = {
    "melon": "https://www.melon.com/",
    "genie": "https://www.genie.co.kr/",
    "bugs": "https://music.bugs.co.kr/",
}

SESSION = requests.Session()
SESSION.headers.update(DEFAULT_HEADERS)


def clean_text(value):
    return re.sub(r"\s+", " ", str(value or "")).strip()


def normalize_artist(value):
    value = clean_text(value).upper()
    value = re.sub(r"\([^)]*\)", "", value)
    return value.strip()


def is_target_artist(artist):
    return normalize_artist(artist) in TARGET_ARTISTS


def get_artist_group(artist):
    return normalize_artist(artist)


def get_korean_time():
    now = datetime.now(ZoneInfo("Asia/Seoul"))
    return {
        "date": now.strftime("%Y-%m-%d"),
        "dateTime": now.strftime("%Y-%m-%d %H:%M:%S KST"),
    }


def create_song_key(song):
    artist = normalize_artist(song.get("artist"))
    title = clean_text(song.get("title")).lower()
    return f"{artist}|||{title}"


def get_change(current_rank, previous_rank):
    if previous_rank is None:
        return {
            "type": "new",
            "value": None,
            "label": "NEW",
        }

    difference = previous_rank - current_rank

    if difference > 0:
        return {
            "type": "up",
            "value": difference,
            "label": f"▲ {difference}",
        }

    if difference < 0:
        return {
            "type": "down",
            "value": abs(difference),
            "label": f"▼ {abs(difference)}",
        }

    return {
        "type": "same",
        "value": 0,
        "label": "—",
    }


def unique_songs(songs):
    seen = set()
    result = []

    for song in songs:
        key = create_song_key(song)
        if key in seen:
            continue
        seen.add(key)
        result.append(song)

    return result


def normalize_image_url(raw_url, base_url):
    raw_url = clean_text(raw_url)

    if not raw_url or raw_url.lower().startswith("data:"):
        return ""

    lower = raw_url.lower()
    if any(
        token in lower
        for token in (
            "blank.gif",
            "spacer.gif",
            "transparent.",
            "noimage",
            "no_image",
        )
    ):
        return ""

    if raw_url.startswith("//"):
        return "https:" + raw_url

    return urljoin(base_url, raw_url)


def extract_album_image(row, base_url, selectors):
    """
    사이트마다 lazy-load 속성명이 달라도 찾을 수 있게 여러 속성을 확인합니다.
    """
    attrs = (
        "data-src",
        "data-original",
        "data-lazy-src",
        "data-lazy",
        "lazy-src",
        "data-img",
        "src",
    )

    candidates = []

    for selector in selectors:
        image = row.select_one(selector)
        if not image:
            continue

        for attr in attrs:
            url = normalize_image_url(image.get(attr), base_url)
            if url:
                candidates.append(url)

    # 앨범 CDN처럼 보이는 후보를 먼저 사용
    preferred_tokens = (
        "cdnimg.melon.co.kr",
        "image.genie.co.kr",
        "image.bugsm.co.kr",
        "album",
    )

    for url in candidates:
        if any(token in url.lower() for token in preferred_tokens):
            return url

    return candidates[0] if candidates else ""


def album_cache_stem(song):
    key = create_song_key(song)
    return hashlib.sha1(key.encode("utf-8")).hexdigest()[:20]


def content_type_to_ext(content_type):
    content_type = (content_type or "").lower()

    if "png" in content_type:
        return ".png"
    if "webp" in content_type:
        return ".webp"
    if "gif" in content_type:
        return ".gif"

    return ".jpg"


def find_existing_album_file(stem):
    for ext in (".jpg", ".jpeg", ".png", ".webp", ".gif"):
        path = ALBUM_DIR / f"{stem}{ext}"
        if path.exists() and path.stat().st_size > 1024:
            return path
    return None


def download_image(url, site):
    headers = {
        "User-Agent": DEFAULT_HEADERS["User-Agent"],
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "Referer": SITE_REFERERS.get(site, ""),
    }

    response = SESSION.get(url, headers=headers, timeout=20)
    response.raise_for_status()

    content_type = response.headers.get("Content-Type", "")
    if "image/" not in content_type.lower():
        raise RuntimeError(f"이미지 응답이 아님: {content_type or 'unknown'}")

    if len(response.content) <= 1024:
        raise RuntimeError(f"이미지 파일이 너무 작음: {len(response.content)} bytes")

    return response.content, content_type


def cache_album_image(song, remote_url, site):
    """
    원본 CDN → 직접 다운로드를 먼저 시도.
    실패하면 wsrv.nl 프록시를 통해 한 번 더 시도.
    성공하면 chart-data.json에는 우리 사이트 로컬 경로를 저장합니다.
    """
    remote_url = clean_text(remote_url)
    if not remote_url:
        return ""

    stem = album_cache_stem(song)
    existing = find_existing_album_file(stem)

    if existing:
        return f"/assets/albums/{existing.name}"

    attempts = [
        remote_url,
        f"https://wsrv.nl/?url={quote(remote_url, safe='')}&w=500&h=500&fit=cover&output=jpg&q=90",
    ]

    last_error = None

    for index, url in enumerate(attempts, start=1):
        try:
            content, content_type = download_image(url, site if index == 1 else "")
            ext = content_type_to_ext(content_type)
            target = ALBUM_DIR / f"{stem}{ext}"
            target.write_bytes(content)
            print(f"  앨범 이미지 저장: {target}")
            return f"/assets/albums/{target.name}"
        except Exception as exc:
            last_error = exc

    print(f"  앨범 이미지 실패 [{site}] {song.get('title')}: {last_error}")
    return ""


def parse_melon(html):
    soup = BeautifulSoup(html, "html.parser")
    songs = []

    for row in soup.select("tr.lst50, tr.lst100"):
        rank_el = row.select_one(".rank")
        title_el = row.select_one(".rank01 a")
        artist_el = row.select_one(".rank02 a")

        rank_text = clean_text(rank_el.get_text(" ", strip=True) if rank_el else "")
        title = clean_text(title_el.get_text(" ", strip=True) if title_el else "")
        artist = clean_text(artist_el.get_text(" ", strip=True) if artist_el else "")

        image_url = extract_album_image(
            row,
            "https://www.melon.com",
            [
                ".image_typeAll img",
                ".wrap img",
                "td img",
                "img",
            ],
        )

        match = re.search(r"\d+", rank_text)
        rank = int(match.group()) if match else None

        if rank and title and artist and is_target_artist(artist):
            song = {
                "rank": rank,
                "title": title,
                "artist": artist,
                "artistGroup": get_artist_group(artist),
            }
            song["albumImage"] = cache_album_image(song, image_url, "melon")
            songs.append(song)

    return unique_songs(songs)


def parse_genie(html):
    soup = BeautifulSoup(html, "html.parser")
    songs = []

    for row in soup.select("table.list-wrap tbody tr"):
        rank_el = row.select_one("td.number")
        title_el = row.select_one("a.title.ellipsis")
        artist_el = row.select_one("a.artist.ellipsis")

        rank_text = clean_text(rank_el.get_text(" ", strip=True) if rank_el else "")
        title = clean_text(title_el.get_text(" ", strip=True) if title_el else "")
        artist = clean_text(artist_el.get_text(" ", strip=True) if artist_el else "")

        image_url = extract_album_image(
            row,
            "https://www.genie.co.kr",
            [
                "a.cover img",
                ".cover img",
                "td.info img",
                "td img",
                "img",
            ],
        )

        match = re.search(r"\d+", rank_text)
        rank = int(match.group()) if match else None

        if rank and title and artist and is_target_artist(artist):
            song = {
                "rank": rank,
                "title": title,
                "artist": artist,
                "artistGroup": get_artist_group(artist),
            }
            song["albumImage"] = cache_album_image(song, image_url, "genie")
            songs.append(song)

    return unique_songs(songs)


def parse_bugs(html):
    soup = BeautifulSoup(html, "html.parser")
    songs = []

    for row in soup.select("tr"):
        rank_el = row.select_one(".ranking strong")
        title_el = row.select_one("th p.title a")
        artist_el = row.select_one("p.artist a")

        rank_text = clean_text(rank_el.get_text(" ", strip=True) if rank_el else "")
        title = clean_text(title_el.get_text(" ", strip=True) if title_el else "")
        artist = clean_text(artist_el.get_text(" ", strip=True) if artist_el else "")

        image_url = extract_album_image(
            row,
            "https://music.bugs.co.kr",
            [
                "a.thumbnail img",
                ".thumbnail img",
                "td.thumbnail img",
                "td img",
                "img",
            ],
        )

        match = re.search(r"\d+", rank_text)
        rank = int(match.group()) if match else None

        if rank and title and artist and is_target_artist(artist):
            song = {
                "rank": rank,
                "title": title,
                "artist": artist,
                "artistGroup": get_artist_group(artist),
            }
            song["albumImage"] = cache_album_image(song, image_url, "bugs")
            songs.append(song)

    return unique_songs(songs)


PARSERS = {
    "melon": parse_melon,
    "genie": parse_genie,
    "bugs": parse_bugs,
}


def fetch_html(url, retries=3, timeout=20):
    last_error = None

    for attempt in range(1, retries + 1):
        try:
            response = SESSION.get(url, timeout=timeout)
            response.raise_for_status()

            if not response.encoding or response.encoding.lower() == "iso-8859-1":
                response.encoding = response.apparent_encoding

            return response.text

        except requests.RequestException as exc:
            last_error = exc
            print(f"  요청 실패 {attempt}/{retries}: {exc}")

            if attempt < retries:
                time.sleep(3 * attempt)

    raise RuntimeError(str(last_error))


def load_previous_data():
    if not OUTPUT_FILE.exists():
        return {"charts": {}}

    try:
        return json.loads(OUTPUT_FILE.read_text(encoding="utf-8"))
    except Exception as exc:
        print(f"이전 chart-data.json 읽기 실패: {exc}")
        return {"charts": {}}


def main():
    previous_data = load_previous_data()
    korean_time = get_korean_time()

    output = {
        "updatedAt": korean_time["dateTime"],
        "melonDailyDate": korean_time["date"],
        "artists": ["G-DRAGON", "BIGBANG"],
        "charts": {},
    }

    print("차트 데이터 자동 갱신 시작")
    print(f"기준 시각: {output['updatedAt']}")

    success_count = 0

    for source in SOURCES:
        print()
        print(f"[{source['name']}] 수집 중...")

        previous_chart = previous_data.get("charts", {}).get(source["id"])
        previous_songs = (previous_chart or {}).get("songs", [])

        previous_ranks = {
            create_song_key(song): song.get("rank")
            for song in previous_songs
        }

        try:
            html = fetch_html(source["url"])
            parser = PARSERS[source["parser"]]
            parsed_songs = parser(html)

            songs = []

            for song in parsed_songs:
                song_with_change = {
                    **song,
                    "change": get_change(
                        song["rank"],
                        previous_ranks.get(create_song_key(song)),
                    ),
                }
                songs.append(song_with_change)

            output["charts"][source["id"]] = {
                "id": source["id"],
                "name": source["name"],
                "type": source["type"],
                "status": "ok",
                "updatedAt": korean_time["dateTime"],
                "songs": songs,
            }

            success_count += 1
            print(f"성공: {len(songs)}곡")

            for song in songs:
                print(
                    f"{song['rank']}위 {song['change']['label']} | "
                    f"{song['title']} | {song['artist']} | "
                    f"cover={'OK' if song.get('albumImage') else 'NONE'}"
                )

        except Exception as exc:
            print(f"실패: {exc}")
            print("직전 정상 데이터가 있으면 그대로 유지합니다.")

            if previous_chart:
                fallback = dict(previous_chart)
                fallback["status"] = "error"
                fallback["error"] = str(exc)
                output["charts"][source["id"]] = fallback
            else:
                output["charts"][source["id"]] = {
                    "id": source["id"],
                    "name": source["name"],
                    "type": source["type"],
                    "status": "error",
                    "updatedAt": None,
                    "songs": [],
                    "error": str(exc),
                }

    if success_count == 0:
        print()
        print("모든 차트 수집 실패 → 기존 chart-data.json을 유지합니다.")
        raise RuntimeError("모든 차트 수집에 실패했습니다.")

    OUTPUT_FILE.write_text(
        json.dumps(output, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8",
    )

    print()
    print(f"성공 플랫폼: {success_count}/{len(SOURCES)}")
    print(f"저장 완료: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
