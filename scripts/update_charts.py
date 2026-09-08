
import json
import re
import time
from datetime import datetime
from pathlib import Path
from urllib.parse import unquote, urljoin
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

DEFAULT_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/126.0.0.0 Safari/537.36"
    ),
    "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
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

# 멜론 공식 모바일 차트 API
MELON_APP_VERSION = "6.5.8.1"
MELON_CP_ID = "AS40"
MELON_TOP100_API = (
    "https://m2.melon.com/m6/chart/ent/songChartList.json"
    f"?cpId={MELON_CP_ID}&cpKey=14LNC3&appVer={MELON_APP_VERSION}"
)
MELON_MOBILE_HEADERS = {
    "User-Agent": f"{MELON_CP_ID}; Android 13; {MELON_APP_VERSION}; sdk_gphone64_arm64"
}

# 지니 공식 앱 차트 API
GENIE_REALTIME_API = "https://app.genie.co.kr/chart/j_RealTimeRankSongList.json"

# 벅스 공식 모바일 차트 API
BUGS_REALTIME_API = "https://m.bugs.co.kr/api/getChartTrack"


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


def official_change(current_rank, previous_rank=None, is_new=False):
    """
    우리 사이트 직전 수집값이 아니라 각 플랫폼이 제공하는 이전 순위를 기준으로 계산.
    """
    if is_new:
        return {
            "type": "new",
            "value": None,
            "label": "NEW",
        }

    try:
        current_rank = int(current_rank)
        previous_rank = int(previous_rank)
    except (TypeError, ValueError):
        return {
            "type": "same",
            "value": 0,
            "label": "—",
        }

    # 플랫폼에서 이전 순위가 0으로 오는 경우 신규/비교불가로 처리
    if previous_rank <= 0:
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


def melon_html_change(row):
    """
    멜론 일간 페이지가 직접 표시하는 '순위등락' 영역을 읽음.
    """
    rank_wrap = row.select_one(".rank_wrap")
    if not rank_wrap:
        return {
            "type": "same",
            "value": 0,
            "label": "—",
        }

    text = clean_text(rank_wrap.get_text(" ", strip=True))
    class_text = " ".join(
        " ".join(el.get("class", []))
        for el in rank_wrap.find_all(True)
    ).lower()

    if "new" in text.lower() or "rank_new" in class_text:
        return {
            "type": "new",
            "value": None,
            "label": "NEW",
        }

    number_match = re.search(r"\d+", text)
    value = int(number_match.group()) if number_match else 0

    if "상승" in text or "rank_up" in class_text:
        return {
            "type": "up",
            "value": value,
            "label": f"▲ {value}",
        }

    if "하락" in text or "rank_down" in class_text:
        return {
            "type": "down",
            "value": value,
            "label": f"▼ {value}",
        }

    return {
        "type": "same",
        "value": 0,
        "label": "—",
    }


def normalize_image_url(raw_url, base_url=""):
    raw_url = clean_text(raw_url)
    if not raw_url or raw_url.lower().startswith("data:"):
        return ""

    if raw_url.startswith("//"):
        return "https:" + raw_url

    return urljoin(base_url, raw_url)


def extract_album_image(row, base_url):
    attrs = (
        "data-src",
        "data-original",
        "data-lazy-src",
        "data-lazy",
        "lazy-src",
        "data-img",
        "src",
    )

    selectors = (
        ".image_typeAll img",
        "a.cover img",
        ".cover img",
        "a.thumbnail img",
        ".thumbnail img",
        "td img",
        "img",
    )

    for selector in selectors:
        image = row.select_one(selector)
        if not image:
            continue

        for attr in attrs:
            url = normalize_image_url(image.get(attr), base_url)
            if not url:
                continue

            lower = url.lower()
            if any(x in lower for x in ("blank.gif", "spacer.gif", "transparent.", "noimage", "no_image")):
                continue

            return url

    return ""


def album_cache_stem(song):
    return hashlib.sha1(
        create_song_key(song).encode("utf-8")
    ).hexdigest()[:20]


def find_existing_album_file(stem):
    for ext in (".jpg", ".jpeg", ".png", ".webp", ".gif"):
        path = ALBUM_DIR / f"{stem}{ext}"
        if path.exists() and path.stat().st_size > 1024:
            return path
    return None


def content_type_to_ext(content_type):
    content_type = (content_type or "").lower()
    if "png" in content_type:
        return ".png"
    if "webp" in content_type:
        return ".webp"
    if "gif" in content_type:
        return ".gif"
    return ".jpg"


def cache_album_image(song, remote_url, site):
    remote_url = clean_text(remote_url)
    if not remote_url:
        return ""

    stem = album_cache_stem(song)
    existing = find_existing_album_file(stem)
    if existing:
        return f"/assets/albums/{existing.name}"

    headers = {
        "User-Agent": DEFAULT_HEADERS["User-Agent"],
        "Accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        "Referer": SITE_REFERERS.get(site, ""),
    }

    try:
        response = SESSION.get(
            remote_url,
            headers=headers,
            timeout=20,
        )
        response.raise_for_status()

        content_type = response.headers.get("Content-Type", "")
        if "image/" not in content_type.lower():
            raise RuntimeError(f"이미지 응답이 아님: {content_type}")

        if len(response.content) <= 1024:
            raise RuntimeError(f"이미지 파일이 너무 작음: {len(response.content)} bytes")

        ext = content_type_to_ext(content_type)
        target = ALBUM_DIR / f"{stem}{ext}"
        target.write_bytes(response.content)

        print(f"  앨범 이미지 저장: {target}")
        return f"/assets/albums/{target.name}"

    except Exception as exc:
        print(f"  앨범 이미지 실패 [{site}] {song.get('title')}: {exc}")
        return ""


def fetch_melon_top100():
    """
    멜론 공식 모바일 데이터의 CURRANK / PASTRANK / RANKTYPE 사용.
    """
    response = SESSION.get(
        MELON_TOP100_API,
        headers=MELON_MOBILE_HEADERS,
        timeout=20,
    )
    response.raise_for_status()
    data = response.json()

    songs = []

    for item in data.get("response", {}).get("SONGLIST", []):
        title = clean_text(item.get("SONGNAME"))
        artists = item.get("ARTISTLIST") or []
        artist = clean_text(
            artists[0].get("ARTISTNAME") if artists else ""
        )

        if not title or not artist or not is_target_artist(artist):
            continue

        rank = int(item.get("CURRANK") or 0)
        previous_rank = int(item.get("PASTRANK") or 0)
        rank_type = clean_text(item.get("RANKTYPE")).upper()
        album_image_url = clean_text(item.get("ALBUMIMG"))

        song = {
            "rank": rank,
            "title": title,
            "artist": artist,
            "artistGroup": get_artist_group(artist),
            "change": official_change(
                rank,
                previous_rank,
                is_new=(rank_type == "NEW"),
            ),
        }
        song["albumImage"] = cache_album_image(
            song,
            album_image_url,
            "melon",
        )
        songs.append(song)

    return songs


def fetch_melon_daily():
    """
    멜론 일간 페이지가 직접 표시하는 순위등락을 사용.
    """
    response = SESSION.get(
        "https://www.melon.com/chart/day/index.htm",
        timeout=20,
    )
    response.raise_for_status()

    if not response.encoding or response.encoding.lower() == "iso-8859-1":
        response.encoding = response.apparent_encoding

    soup = BeautifulSoup(response.text, "html.parser")
    songs = []

    for row in soup.select("tr.lst50, tr.lst100"):
        rank_el = row.select_one(".rank")
        title_el = row.select_one(".rank01 a")
        artist_el = row.select_one(".rank02 a")

        rank_text = clean_text(
            rank_el.get_text(" ", strip=True) if rank_el else ""
        )
        title = clean_text(
            title_el.get_text(" ", strip=True) if title_el else ""
        )
        artist = clean_text(
            artist_el.get_text(" ", strip=True) if artist_el else ""
        )

        match = re.search(r"\d+", rank_text)
        rank = int(match.group()) if match else None

        if not rank or not title or not artist or not is_target_artist(artist):
            continue

        image_url = extract_album_image(
            row,
            "https://www.melon.com",
        )

        song = {
            "rank": rank,
            "title": title,
            "artist": artist,
            "artistGroup": get_artist_group(artist),
            "change": melon_html_change(row),
        }
        song["albumImage"] = cache_album_image(
            song,
            image_url,
            "melon",
        )
        songs.append(song)

    return songs


def fetch_genie_top200():
    """
    지니 공식 앱 실시간 차트 API의 RANK_NO / PRE_RANK_NO 사용.
    """
    response = SESSION.post(
        GENIE_REALTIME_API,
        headers={
            "Content-Type": "application/x-www-form-urlencoded",
            "User-Agent": DEFAULT_HEADERS["User-Agent"],
        },
        data={"pgSize": "200"},
        timeout=20,
    )
    response.raise_for_status()
    data = response.json()

    result = data.get("Result", {})
    if int(result.get("RetCode") or 0) > 0:
        raise RuntimeError(
            f"Genie API error: {result.get('RetMsg')}"
        )

    songs = []

    for item in data.get("DataSet", {}).get("DATA", []):
        title = clean_text(unquote(str(item.get("SONG_NAME") or "")))
        artist = clean_text(unquote(str(item.get("ARTIST_NAME") or "")))

        if not title or not artist or not is_target_artist(artist):
            continue

        rank = int(item.get("RANK_NO") or 0)
        previous_rank = int(item.get("PRE_RANK_NO") or 0)
        album_image_url = normalize_image_url(
            unquote(str(item.get("ALBUM_IMG_PATH") or "")),
            "https://www.genie.co.kr",
        )

        song = {
            "rank": rank,
            "title": title,
            "artist": artist,
            "artistGroup": get_artist_group(artist),
            "change": official_change(
                rank,
                previous_rank,
            ),
        }
        song["albumImage"] = cache_album_image(
            song,
            album_image_url,
            "genie",
        )
        songs.append(song)

    return songs


def fetch_bugs_realtime():
    """
    벅스 공식 모바일 차트 API의 rank / rank_last 사용.
    """
    response = SESSION.post(
        BUGS_REALTIME_API,
        headers={
            "User-Agent": (
                "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) "
                "AppleWebKit/537.36 (KHTML, like Gecko) "
                "Chrome/112.0.0.0 Mobile Safari/537.36"
            )
        },
        data={
            "period_tp": "realtime",
            "svc_type": 20151,
            "size": 100,
        },
        timeout=20,
    )
    response.raise_for_status()
    data = response.json()

    if int(data.get("ret_code") or 0) > 0:
        raise RuntimeError(
            f"Bugs API error: {data.get('ret_msg')}"
        )

    songs = []

    for item in data.get("list", []):
        title = clean_text(item.get("track_title"))
        artists = item.get("artists") or []
        artist = clean_text(
            artists[0].get("artist_nm") if artists else ""
        )

        if not title or not artist or not is_target_artist(artist):
            continue

        list_attr = item.get("list_attr") or {}
        rank = int(list_attr.get("rank") or 0)
        previous_rank = int(list_attr.get("rank_last") or 0)

        image_path = (
            ((item.get("album") or {}).get("image") or {}).get("path")
            or ""
        )
        album_image_url = (
            f"https://image.bugsm.co.kr/album/images/256{image_path}"
            if image_path else ""
        )

        song = {
            "rank": rank,
            "title": title,
            "artist": artist,
            "artistGroup": get_artist_group(artist),
            "change": official_change(
                rank,
                previous_rank,
            ),
        }
        song["albumImage"] = cache_album_image(
            song,
            album_image_url,
            "bugs",
        )
        songs.append(song)

    return songs


SOURCES = [
    {
        "id": "melonTop100",
        "name": "멜론 TOP100",
        "type": "realtime",
        "fetcher": fetch_melon_top100,
    },
    {
        "id": "melonDaily",
        "name": "멜론 일간",
        "type": "daily",
        "fetcher": fetch_melon_daily,
    },
    {
        "id": "genieTop200",
        "name": "지니 TOP200",
        "type": "realtime",
        "fetcher": fetch_genie_top200,
    },
    {
        "id": "bugsRealtime",
        "name": "벅스 실시간",
        "type": "realtime",
        "fetcher": fetch_bugs_realtime,
    },
]


def load_previous_data():
    if not OUTPUT_FILE.exists():
        return {"charts": {}}

    try:
        return json.loads(
            OUTPUT_FILE.read_text(encoding="utf-8")
        )
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
        "changeBasis": "platform",
        "charts": {},
    }

    print("차트 데이터 자동 갱신 시작")
    print(f"기준 시각: {output['updatedAt']}")
    print("등락 기준: 각 플랫폼 공식 제공값")

    success_count = 0

    for source in SOURCES:
        print()
        print(f"[{source['name']}] 수집 중...")

        previous_chart = (
            previous_data.get("charts", {})
            .get(source["id"])
        )

        try:
            songs = source["fetcher"]()

            output["charts"][source["id"]] = {
                "id": source["id"],
                "name": source["name"],
                "type": source["type"],
                "status": "ok",
                "updatedAt": korean_time["dateTime"],
                "changeBasis": "platform",
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
                    "changeBasis": "platform",
                    "songs": [],
                    "error": str(exc),
                }

    if success_count == 0:
        print()
        print("모든 차트 수집 실패 → 기존 chart-data.json을 유지합니다.")
        raise RuntimeError(
            "모든 차트 수집에 실패했습니다."
        )

    OUTPUT_FILE.write_text(
        json.dumps(
            output,
            ensure_ascii=False,
            indent=2,
        ) + "\n",
        encoding="utf-8",
    )

    print()
    print(f"성공 플랫폼: {success_count}/{len(SOURCES)}")
    print(f"저장 완료: {OUTPUT_FILE}")


if __name__ == "__main__":
    main()
