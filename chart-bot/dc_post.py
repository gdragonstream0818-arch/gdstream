=import html
import json
import os
import time
import traceback

from datetime import datetime
from pathlib import Path
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
# 브라우저
# 로그인에 성공했던 설정 유지
# ==================================================

def create_browser():
    options = Options()

    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    options.add_argument("--window-size=1920,1080")
    options.add_argument("--disable-blink-features=AutomationControlled")
    options.add_argument("--disable-gpu")
    options.add_argument("--remote-debugging-port=9222")
    options.add_argument(
        "--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64)"
    )

    driver = webdriver.Chrome(options=options)
    driver.set_page_load_timeout(60)

    return driver


# ==================================================
# 공통 기능 / 진단
# ==================================================

def read_alert(driver, timeout=1):
    """알림을 읽고 확인 버튼을 누릅니다."""
    deadline = time.monotonic() + timeout

    while time.monotonic() < deadline:
        try:
            alert = driver.switch_to.alert
            text = alert.text
            alert.accept()

            print("⚠️ 알림:", text, flush=True)
            return text

        except NoAlertPresentException:
            time.sleep(0.2)

    return None


def save_state(driver, name):
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
                    ? document.body.innerText.slice(0, 12000)
                    : ''
            };
            """
        )

        (DEBUG_DIR / f"{name}.txt").write_text(
            json.dumps(info, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )

        print("현재 URL:", info["url"], flush=True)
        print(
            "화면 내용:",
            info["bodyText"][:2000],
            flush=True,
        )

    except Exception as e:
        print("화면 내용 저장 실패:", type(e).__name__, flush=True)


def diagnose(driver):
    print("===== 제출 전 진단 =====", flush=True)

    info = driver.execute_script(
        """
        return {
            title: document.querySelector('#subject')?.value || '',
            textareas: Array.from(
                document.querySelectorAll('textarea')
            ).map(el => ({
                id: el.id,
                name: el.name,
                length: (el.value || '').length
            })),
            visibleInputs: Array.from(
                document.querySelectorAll('input')
            ).filter(el => el.getClientRects().length).map(el => ({
                id: el.id,
                name: el.name,
                type: el.type,
                required: el.required,
                empty: !el.value,
                valid: el.validity.valid,
                message: el.validationMessage
            }))
        };
        """
    )

    # 비밀번호 등 입력값은 출력하지 않습니다.
    print(
        json.dumps(info, ensure_ascii=False, indent=2),
        flush=True,
    )


# ==================================================
# 로그인 / 글쓰기 이동
# 기존 흐름 유지
# ==================================================

def login(driver):
    print("===== 로그인 시작 =====", flush=True)

    if not os.environ.get("DC_ID") or not os.environ.get("DC_PASSWORD"):
        raise RuntimeError(
            "DC_ID / DC_PASSWORD 환경변수를 확인하세요."
        )

    driver.get(LOGIN_URL)

    wait = WebDriverWait(driver, 20)

    id_box = wait.until(
        EC.presence_of_element_located((By.NAME, "user_id"))
    )

    pw_box = wait.until(
        EC.presence_of_element_located((By.NAME, "pw"))
    )

    id_box.send_keys(os.environ["DC_ID"])
    pw_box.send_keys(os.environ["DC_PASSWORD"])

    login_btn = wait.until(
        EC.element_to_be_clickable(
            (By.CSS_SELECTOR, "button[type='submit']")
        )
    )

    login_btn.click()

    read_alert(driver, timeout=3)
    time.sleep(3)

    print("로그인 후:", driver.current_url, flush=True)
    save_state(driver, "after_login")


def move_write_page(driver):
    print("===== 글쓰기 이동 =====", flush=True)

    driver.get(GALLERY_URL)
    time.sleep(5)

    links = driver.find_elements(By.TAG_NAME, "a")

    for link in links:
        try:
            text = link.text.strip()
            href = link.get_attribute("href") or ""

            if "글쓰기" not in text and "/board/write" not in href:
                continue

            if not link.is_displayed():
                continue

            print("글쓰기 발견:", href, flush=True)

            # 기존에 동작했던 이동 방식 유지
            driver.execute_script("arguments[0].click();", link)

            read_alert(driver, timeout=1)

            WebDriverWait(driver, 20).until(
                EC.presence_of_element_located((By.ID, "subject"))
            )

            print(
                "글쓰기 페이지 URL:",
                driver.current_url,
                flush=True,
            )
            return

        except StaleElementReferenceException:
            continue

    raise RuntimeError("글쓰기 버튼을 찾지 못했습니다.")


# ==================================================
# 글 작성
# ==================================================

def write_post(driver, title, content):
    print("===== 글 작성 =====", flush=True)

    wait = WebDriverWait(driver, 20)

    subject = wait.until(
        EC.presence_of_element_located((By.ID, "subject"))
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

            // 현재 에디터와 연결된 실제 Summernote 요소 찾기
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

        // 일반적인 Summernote textarea 배치 확인
        if (!source && wrapper) {
            const previous = wrapper.previousElementSibling;

            if (
                previous &&
                previous.tagName.toLowerCase() === 'textarea'
            ) {
                source = previous;
            }
        }

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

    actual_title = subject.get_attribute("value") or ""

    if actual_title.strip() != title.strip():
        raise RuntimeError("제목이 정상 입력되지 않았습니다.")

    expected = " ".join(content.split())
    actual = " ".join((result.get("text") or "").split())

    if expected != actual:
        raise RuntimeError("본문이 정상 입력되지 않았습니다.")

    print("제목 입력 완료", flush=True)
    print("본문 입력 완료", flush=True)
    print(
        "에디터 원본 발견:",
        result["sourceFound"],
        "/ API 동기화:",
        result["apiSynced"],
        flush=True,
    )

    time.sleep(3)


# ==================================================
# 등록
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

    def ready_button(d):
        for button in d.find_elements(*locator):
            try:
                if (
                    button.is_displayed()
                    and button.is_enabled()
                    and button.get_attribute("disabled") is None
                    and (
                        button.get_attribute("aria-disabled") or ""
                    ).lower() != "true"
                ):
                    return button

            except StaleElementReferenceException:
                continue

        return False

    driver.execute_script(
        "window.scrollTo(0, document.documentElement.scrollHeight);"
    )

    try:
        target = WebDriverWait(driver, 15).until(ready_button)

    except TimeoutException as e:
        raise RuntimeError(
            "보이고 활성화된 등록 버튼을 찾지 못했습니다."
        ) from e

    print(
        "등록 버튼:",
        target.get_attribute("outerHTML"),
        flush=True,
    )

    driver.execute_script(
        "arguments[0].scrollIntoView({block:'center'});",
        target,
    )

    time.sleep(1)

    # 버튼 중앙을 다른 요소가 가리는지 확인
    hit_test = driver.execute_script(
        """
        const target = arguments[0];
        const rect = target.getBoundingClientRect();
        const top = document.elementFromPoint(
            rect.left + rect.width / 2,
            rect.top + rect.height / 2
        );

        return {
            clear: Boolean(
                top && (top === target || target.contains(top))
            ),
            topElement: top ? top.outerHTML.slice(0, 600) : null
        };
        """,
        target,
    )

    print(
        "버튼 가림 확인:",
        json.dumps(hit_test, ensure_ascii=False),
        flush=True,
    )

    save_state(driver, "before_submit")

    # 클릭은 한 번만 실행합니다.
    # 성공 여부가 불확실한 상태에서 JS로 재클릭하지 않습니다.
    try:
        target.click()
        print("일반 클릭 실행 완료", flush=True)

    except UnexpectedAlertPresentException:
        print("클릭 중 알림 발생, 결과 확인", flush=True)

    except Exception as e:
        raise RuntimeError(
            "등록 버튼 실제 클릭 실패: "
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
        "버튼은 클릭했지만 글 보기 화면 이동을 확인하지 못했습니다.\n"
        f"알림: {' / '.join(messages) or '없음'}\n"
        "말머리·필수 입력·추가 인증 등의 화면 안내를 확인하세요. "
        "등록됐을 수도 있으므로 재실행 전 게시판을 확인하세요."
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

        stage = "글 작성"
        write_post(driver, title, content)

        stage = "제출 전 진단"
        diagnose(driver)
        save_state(driver, "final_debug")

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
