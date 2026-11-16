import html
import json
import os
import time
import traceback

from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC

from selenium.common.exceptions import (
    NoAlertPresentException,
    UnexpectedAlertPresentException,
    StaleElementReferenceException,
    TimeoutException,
)


LOGIN_URL = "https://sign.dcinside.com/login"

GALLERY_URL = (
    "https://gall.dcinside.com/mgallery/board/lists"
    "?id=gdpeaceminusone"
)

DEBUG_DIR = Path("dc-debug")

CHART_ORDER = [
    "melonTop100",
    "melonDaily",
    "genieTop200",
    "bugsRealtime",
]


# ==================================================
# 차트 데이터 / 글 내용
# ==================================================

def load_chart_data():
    print("===== 음총 차트 데이터 읽기 =====", flush=True)

    with open("chart-data.json", "r", encoding="utf-8") as f:
        data = json.load(f)

    print("차트 기준시간:", data.get("updatedAt"), flush=True)

    return data


def make_title():
    now = datetime.now(ZoneInfo("Asia/Seoul"))
    return f"[음원차트] {now.strftime('%m/%d %H:%M')} 업데이트"


def make_content(data):
    lines = [
        "📊 G-DRAGON / BIGBANG 음원 차트 현황",
        "",
        f"기준시간 : {data.get('updatedAt', '')}",
        "",
    ]

    charts = data.get("charts") or {}

    for chart_id in CHART_ORDER:
        chart = charts.get(chart_id)

        if not chart:
            continue

        lines.append(f"【{chart.get('name', '')}】")

        songs = chart.get("songs") or []

        if not songs:
            lines.extend(["차트인 없음", ""])
            continue

        for song in songs:
            change = (song.get("change") or {}).get("label", "")

            lines.append(
                f"{song.get('rank', '')}위 "
                f"{song.get('artist', '')} - "
                f"{song.get('title', '')} "
                f"{change}"
            )

        lines.append("")

    lines.append("※ 매시간 자동 업데이트")

    return "\n".join(lines)


# ==================================================
# 브라우저 / 공통 기능
# ==================================================

def create_browser():
    options = Options()

    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--disable-gpu")

    # 잘린 사용자 에이전트와 고정 디버깅 포트는 사용하지 않습니다.
    driver = webdriver.Chrome(options=options)

    driver.set_page_load_timeout(45)

    return driver


def read_alert(driver, timeout=1):
    """알림을 읽고 확인합니다. 입력이 필요한 prompt는 자동 처리하지 않습니다."""
    deadline = time.monotonic() + timeout

    while time.monotonic() < deadline:
        try:
            alert = driver.switch_to.alert
            text = alert.text

            print("⚠️ 알림:", text, flush=True)

            alert.accept()
            return text

        except NoAlertPresentException:
            time.sleep(0.2)

    return None


def save_state(driver, name):
    """
    HTML, 스크린샷, 페이지 텍스트를 각각 저장합니다.
    한 종류의 저장이 실패해도 나머지는 계속 저장합니다.
    """
    DEBUG_DIR.mkdir(parents=True, exist_ok=True)

    try:
        driver.save_screenshot(str(DEBUG_DIR / f"{name}.png"))
    except Exception as e:
        print("스크린샷 저장 실패:", type(e).__name__, flush=True)

    try:
        (DEBUG_DIR / f"{name}.html").write_text(
            driver.page_source,
            encoding="utf-8",
        )
    except Exception as e:
        print("HTML 저장 실패:", type(e).__name__, flush=True)

    try:
        info = driver.execute_script(
            """
            return {
                url: location.href,
                title: document.title,
                readyState: document.readyState,
                bodyText: document.body
                    ? document.body.innerText.slice(0, 8000)
                    : '',
                inputs: Array.from(
                    document.querySelectorAll('input')
                ).map(el => ({
                    id: el.id,
                    name: el.name,
                    type: el.type,
                    visible: Boolean(el.getClientRects().length)
                }))
            };
            """
        )

        # inputの値は記録しません。
        text = json.dumps(info, ensure_ascii=False, indent=2)

        (DEBUG_DIR / f"{name}.txt").write_text(
            text,
            encoding="utf-8",
        )

        print(
            f"診断: URL={info.get('url')} "
            f"/ タイトル={info.get('title')}",
            flush=True,
        )
        print(
            "ページ本文:",
            (info.get("bodyText") or "")[:1500],
            flush=True,
        )

    except Exception as e:
        print("ページ情報保存失敗:", type(e).__name__, flush=True)


def find_visible(driver, selector):
    for element in driver.find_elements(By.CSS_SELECTOR, selector):
        try:
            if element.is_displayed() and element.is_enabled():
                return element
        except StaleElementReferenceException:
            continue

    return False


# ==================================================
# ログイン / 글쓰기 이동
# ==================================================

def login(driver):
    print("===== 로그인 시작 =====", flush=True)

    user_id = os.environ.get("DC_ID")
    password = os.environ.get("DC_PASSWORD")

    if not user_id or not password:
        raise RuntimeError(
            "GitHub Secrets에 DC_ID / DC_PASSWORD가 없습니다."
        )

    driver.get(LOGIN_URL)

    wait = WebDriverWait(driver, 25)

    # 기존 코드와 같은 name 기준으로 요소를 먼저 찾습니다.
    try:
        id_box = wait.until(
            EC.presence_of_element_located(
                (By.NAME, "user_id")
            )
        )

        pw_box = wait.until(
            EC.presence_of_element_located(
                (By.NAME, "pw")
            )
        )

    except TimeoutException as e:
        save_state(driver, "login_page_failed")

        raise RuntimeError(
            "로그인 페이지에서 user_id / pw 입력란을 찾지 못했습니다. "
            "등록 단계가 아니라 로그인 페이지 로딩 단계의 문제입니다. "
            "로그의 페이지 본문과 login_page_failed.txt에 "
            "실제로 열린 화면을 기록했습니다."
        ) from e

    if not id_box.is_displayed() or not pw_box.is_displayed():
        save_state(driver, "login_inputs_hidden")

        raise RuntimeError(
            "로그인 입력란은 존재하지만 화면에 표시되지 않습니다. "
            "로그인 페이지의 표시 상태를 확인해야 합니다."
        )

    id_box.clear()
    id_box.send_keys(user_id)

    pw_box.clear()
    pw_box.send_keys(password)

    login_btn = wait.until(
        EC.element_to_be_clickable(
            (By.CSS_SELECTOR, "button[type='submit']")
        )
    )

    login_btn.click()

    message = read_alert(driver, timeout=3)

    if message:
        print("로그인 안내:", message, flush=True)

    time.sleep(2)

    print("로그인 후 URL:", driver.current_url, flush=True)

    # 실제 로그인 여부는 다음 갤러리 페이지에서도 확인합니다.


def move_write_page(driver):
    print("===== 글쓰기 이동 =====", flush=True)

    driver.get(GALLERY_URL)

    wait = WebDriverWait(driver, 20)

    wait.until(
        EC.presence_of_element_located((By.TAG_NAME, "body"))
    )

    def find_write_link(d):
        for link in d.find_elements(By.TAG_NAME, "a"):
            try:
                if not link.is_displayed() or not link.is_enabled():
                    continue

                text = link.text.strip()
                href = link.get_attribute("href") or ""

                if "글쓰기" in text or "/board/write" in href:
                    return link

            except StaleElementReferenceException:
                continue

        return False

    try:
        link = wait.until(find_write_link)

        print(
            "글쓰기 발견:",
            link.get_attribute("href"),
            flush=True,
        )

        driver.execute_script(
            "arguments[0].scrollIntoView({block:'center'});",
            link,
        )

        link.click()

        message = read_alert(driver, timeout=2)

        if message:
            print("글쓰기 이동 안내:", message, flush=True)

        wait.until(
            EC.visibility_of_element_located((By.ID, "subject"))
        )

        # 원본 코드 역시 회원 로그인을 전제로 하므로
        # 비회원 작성용 비밀번호 칸이 보이면 게시를 중단합니다.
        guest_password = find_visible(
            driver,
            "input[type='password']",
        )

        if guest_password:
            save_state(driver, "guest_write_page")

            raise RuntimeError(
                "글쓰기 화면에 비밀번호 입력란이 표시됩니다. "
                "비회원 작성 화면일 가능성이 있어 게시를 중단합니다."
            )

    except TimeoutException as e:
        save_state(driver, "write_page_failed")

        raise RuntimeError(
            "글쓰기 화면의 제목 입력란을 찾지 못했습니다. "
            "로그인 실패·글쓰기 권한·추가 안내를 확인해야 합니다."
        ) from e

    print("글쓰기 페이지:", driver.current_url, flush=True)


# ==================================================
# 제목 / 본문 입력
# ==================================================

def write_post(driver, title, content):
    print("===== 글 작성 =====", flush=True)

    driver.switch_to.default_content()

    wait = WebDriverWait(driver, 20)

    subject = wait.until(
        EC.element_to_be_clickable((By.ID, "subject"))
    )

    subject.clear()
    subject.send_keys(title)

    editor = wait.until(
        EC.visibility_of_element_located(
            (
                By.CSS_SELECTOR,
                ".note-editable[contenteditable='true']",
            )
        )
    )

    # 제목·가수명 등에 들어가는 특수문자를 안전하게 처리합니다.
    content_html = html.escape(content).replace("\n", "<br>")

    result = driver.execute_script(
        """
        const editor = arguments[0];
        const code = arguments[1];

        const wrapper = editor.closest('.note-editor');

        let source = null;
        let apiSynced = false;

        if (window.jQuery && wrapper) {
            const $ = window.jQuery;

            // 실제로 이 에디터를 관리하는 Summernote 원본 탐색
            for (const el of document.querySelectorAll(
                'textarea, .summernote'
            )) {
                const instance = $(el).data('summernote');

                if (
                    instance &&
                    instance.layoutInfo &&
                    instance.layoutInfo.editor &&
                    instance.layoutInfo.editor[0] === wrapper
                ) {
                    source = el;
                    break;
                }
            }
        }

        if (!source && wrapper) {
            const previous = wrapper.previousElementSibling;

            if (
                previous &&
                previous.tagName.toLowerCase() === 'textarea'
            ) {
                source = previous;
            }
        }

        // 가능하면 공식 에디터 API를 통해 내부 값도 변경
        if (source && window.jQuery) {
            const $ = window.jQuery;

            if (
                typeof $.fn.summernote === 'function' &&
                $(source).data('summernote')
            ) {
                $(source).summernote('code', code);
                apiSynced = true;
            }
        }

        editor.focus();
        editor.innerHTML = code;

        editor.dispatchEvent(
            new Event('input', {bubbles: true})
        );
        editor.dispatchEvent(
            new Event('change', {bubbles: true})
        );

        if (source && 'value' in source) {
            source.value = code;

            source.dispatchEvent(
                new Event('input', {bubbles: true})
            );
            source.dispatchEvent(
                new Event('change', {bubbles: true})
            );
        }

        editor.blur();

        return {
            text: editor.innerText || editor.textContent || '',
            sourceFound: Boolean(source),
            apiSynced: apiSynced
        };
        """,
        editor,
        content_html,
    )

    if (subject.get_attribute("value") or "").strip() != title.strip():
        raise RuntimeError("제목 입력 확인에 실패했습니다.")

    expected = " ".join(content.split())
    actual = " ".join((result.get("text") or "").split())

    if expected != actual:
        raise RuntimeError("본문 입력 확인에 실패했습니다.")

    print("제목 입력 완료", flush=True)
    print("본문 입력 완료", flush=True)
    print(
        "원본 에디터 요소 발견:",
        result["sourceFound"],
        "/ Summernote API 동기화:",
        result["apiSynced"],
        flush=True,
    )

    time.sleep(1)


# ==================================================
# 등록 버튼 클릭 / 결과 확인
# ==================================================

def submit_post(driver):
    print("===== 등록 버튼 검색 =====", flush=True)

    driver.switch_to.default_content()

    locator = (
        By.XPATH,
        "//button[normalize-space(.)='등록']"
        " | //input[(@type='submit' or @type='button')"
        " and normalize-space(@value)='등록']"
        " | //a[normalize-space(.)='등록']",
    )

    def find_ready_button(d):
        for button in d.find_elements(*locator):
            try:
                if not button.is_displayed():
                    continue

                if not button.is_enabled():
                    continue

                if button.get_attribute("disabled") is not None:
                    continue

                aria_disabled = (
                    button.get_attribute("aria-disabled") or ""
                )

                if aria_disabled.lower() == "true":
                    continue

                return button

            except StaleElementReferenceException:
                continue

        return False

    driver.execute_script(
        "window.scrollTo(0, document.documentElement.scrollHeight);"
    )

    try:
        target = WebDriverWait(driver, 15).until(
            find_ready_button
        )

    except TimeoutException as e:
        save_state(driver, "submit_button_not_found")

        raise RuntimeError(
            "보이고 활성화된 등록 버튼을 찾지 못했습니다."
        ) from e

    print(
        "선택한 등록 버튼:",
        target.get_attribute("outerHTML"),
        flush=True,
    )

    driver.execute_script(
        "arguments[0].scrollIntoView({block:'center'});",
        target,
    )

    time.sleep(0.5)

    save_state(driver, "before_submit")

    # 일반 클릭 한 번만 실행합니다.
    # 클릭 후 다시 누르면 중복 등록될 수 있어 자동 재클릭하지 않습니다.
    try:
        target.click()
        print("등록 버튼 일반 클릭 실행", flush=True)

    except UnexpectedAlertPresentException:
        print("클릭 과정에서 알림 발생", flush=True)

    except Exception as e:
        save_state(driver, "submit_click_failed")

        raise RuntimeError(
            "등록 버튼은 찾았지만 실제 클릭에 실패했습니다. "
            f"{type(e).__name__}: {e}"
        ) from e

    messages = []
    deadline = time.monotonic() + 25

    while time.monotonic() < deadline:
        message = read_alert(driver, timeout=0.3)

        if message:
            messages.append(message)

        try:
            current = driver.current_url

            if "/board/view" in current:
                print("✅ 등록 성공:", current, flush=True)
                save_state(driver, "after_submit")
                return current

        except UnexpectedAlertPresentException:
            continue

        time.sleep(0.3)

    save_state(driver, "after_submit")

    raise RuntimeError(
        "등록 버튼은 클릭했지만 글 보기 화면을 확인하지 못했습니다.\n"
        f"알림: {' / '.join(messages) or '없음'}\n"
        "제목·본문·말머리 등 필수 항목 또는 추가 확인이 "
        "요구될 수 있습니다. after_submit.txt에 페이지 내용을 "
        "저장했습니다. 재실행 전 중복 등록 여부를 확인하세요."
    )


# ==================================================
# 실행
# ==================================================

def main():
    DEBUG_DIR.mkdir(parents=True, exist_ok=True)

    driver = None
    stage = "차트 데이터 읽기"

    try:
        data = load_chart_data()

        title = make_title()
        content = make_content(data)

        print("\n===== 작성 제목 =====", flush=True)
        print(title, flush=True)

        print("\n===== 작성 내용 =====", flush=True)
        print(content, flush=True)

        stage = "브라우저 실행"
        driver = create_browser()

        stage = "로그인"
        login(driver)

        stage = "글쓰기 이동"
        move_write_page(driver)

        stage = "제목·본문 입력"
        write_post(driver, title, content)

        stage = "등록"
        submit_post(driver)

    except Exception as e:
        error_text = (
            f"실패 단계: {stage}\n"
            f"오류 종류: {type(e).__name__}\n"
            f"오류 내용: {e}\n\n"
            f"{traceback.format_exc()}"
        )

        print("\n❌", error_text, flush=True)

        (DEBUG_DIR / "error.txt").write_text(
            error_text,
            encoding="utf-8",
        )

        if driver is not None:
            try:
                read_alert(driver, timeout=0.5)
            except Exception:
                pass

            save_state(driver, "error_state")

        raise

    finally:
        if driver is not None:
            driver.quit()


if __name__ == "__main__":
    main()
