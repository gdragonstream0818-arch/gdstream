import json
import re
import time
from datetime import datetime
from pathlib import Path
from zoneinfo import ZoneInfo

import requests
from bs4 import BeautifulSoup


OUTPUT_FILE = Path.cwd() / "chart-data.json"

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
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,"
              "image/webp,*/*;q=0.8",
    "Cache-Control": "no-cache",
    "Pragma": "no-cache",
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

        match = re.search(r"\d+", rank_text)
        rank = int(match.group()) if match else None

        if rank and title and artist and is_target_artist(artist):
            songs.append({
                "rank": rank,
                "title": title,
                "artist": artist,
                "artistGroup": get_artist_group(artist),
            })

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

        match = re.search(r"\d+", rank_text)
        rank = int(match.group()) if match else None

        if rank and title and artist and is_target_artist(artist):
            songs.append({
                "rank": rank,
                "title": title,
                "artist": artist,
                "artistGroup": get_artist_group(artist),
            })

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

        match = re.search(r"\d+", rank_text)
        rank = int(match.group()) if match else None

        if rank and title and artist and is_target_artist(artist):
            songs.append({
                "rank": rank,
                "title": title,
                "artist": artist,
                "artistGroup": get_artist_group(artist),
            })

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

            # 한국 음원 사이트에서 인코딩 판별이 흔들리는 경우 대비
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
                    f"{song['title']} | {song['artist']}"
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

    # 모든 플랫폼이 실패한 경우 파일 전체 시각을 최신처럼 보이게 만들지 않음
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
